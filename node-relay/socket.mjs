#!/usr/bin/env node
// Minimal Node.js HTTP + WebSocket relay for the Agent to Figma plugin.
// Protocol-compatible with the Bun relay shipped in grab/cursor-talk-to-figma-mcp:
//   join            -> two system replies + "new user" notice to the channel
//                      (optional: role="plugin"|"mcp"|"cli", meta={docName, pageName})
//   update_meta     -> update docName / pageName metadata for the joined client
//   list_channels   -> return active channels snapshot over WebSocket
//   message         -> {type:"broadcast", sender:"peer"} to other clients (no echo)
//                      or immediate NO_PEER error reply when 0 peers can receive a command
//   progress_update -> forwarded as-is to other clients
// HTTP endpoints (loopback only):
//   GET /health     -> relay status JSON
//   GET /channels   -> active channels snapshot JSON
//
// Env:
//   FIGMA_RELAY_PORT  listen port (default 3055)
//   FIGMA_RELAY_HOST  bind address (default 127.0.0.1)
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;
const HOST = process.env.FIGMA_RELAY_HOST || "127.0.0.1";
const VALID_ROLES = new Set(["plugin", "mcp", "cli"]);
const channels = new Map(); // channel -> Set<ws>

function normalizeMeta(raw) {
  if (!raw || typeof raw !== "object") return {};
  const meta = {};
  if (typeof raw.docName === "string") meta.docName = raw.docName.trim();
  if (typeof raw.pageName === "string") meta.pageName = raw.pageName.trim();
  return meta;
}

function getChannelSummary(channelName, set) {
  let clientCount = 0;
  let pluginCount = 0;
  let mcpCount = 0;
  let cliCount = 0;
  let unknownCount = 0;
  let docName = "";
  let pageName = "";
  let connectedAt = null;

  for (const client of set) {
    if (client.readyState !== WebSocket.OPEN) continue;
    clientCount++;
    const role = client._role || "unknown";
    if (role === "plugin") pluginCount++;
    else if (role === "mcp") mcpCount++;
    else if (role === "cli") cliCount++;
    else unknownCount++;

    const ts = client._joinedAt || client._connectedAt || null;
    if (role === "plugin") {
      if (client._meta?.docName) docName = client._meta.docName;
      if (client._meta?.pageName) pageName = client._meta.pageName;
      if (ts && (!connectedAt || ts > connectedAt)) connectedAt = ts;
    } else if (!docName && client._meta?.docName) {
      docName = client._meta.docName;
      if (client._meta?.pageName) pageName = client._meta.pageName;
    }
    if (!connectedAt && ts) connectedAt = ts;
  }

  return {
    channel: channelName,
    clientCount,
    pluginCount,
    mcpCount,
    cliCount,
    unknownCount,
    docName,
    pageName,
    connectedAt,
  };
}

function getChannelsSnapshot() {
  const list = [];
  for (const [channelName, set] of channels.entries()) {
    const summary = getChannelSummary(channelName, set);
    if (summary.clientCount > 0) {
      list.push(summary);
    }
  }
  list.sort((a, b) => {
    if (b.pluginCount !== a.pluginCount) return b.pluginCount - a.pluginCount;
    return (b.connectedAt || 0) - (a.connectedAt || 0);
  });
  return list;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

const httpServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const urlPath = (req.url || "/").split("?")[0];
  if (req.method === "GET" && urlPath === "/channels") {
    sendJson(res, 200, { channels: getChannelsSnapshot() });
    return;
  }

  if (req.method === "GET" && urlPath === "/health") {
    sendJson(res, 200, {
      ok: true,
      host: HOST,
      port: PORT,
      channelCount: getChannelsSnapshot().length,
    });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end("Agent to Figma WebSocket relay running");
});

const wss = new WebSocketServer({ server: httpServer });

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[relay] port ${PORT} is already in use. Stop the other relay or set FIGMA_RELAY_PORT.`
    );
  } else {
    console.error("[relay] server error:", err.message);
  }
  process.exit(1);
});

wss.on("error", (err) => {
  console.error("[relay] websocket server error:", err.message);
});

function leaveChannel(ws) {
  const ch = ws._channel;
  if (!ch) return;
  const set = channels.get(ch);
  if (set) {
    set.delete(ws);
    if (set.size === 0) channels.delete(ch);
    console.log(`[relay] client left channel "${ch}" (role=${ws._role || "unknown"})`);
  }
  ws._channel = null;
}

wss.on("connection", (ws) => {
  ws._channel = null;
  ws._role = "unknown";
  ws._meta = {};
  ws._connectedAt = Date.now();
  ws._joinedAt = null;
  console.log("[relay] client connected");
  ws.send(
    JSON.stringify({
      type: "system",
      message: "Please join a channel to start chatting",
    })
  );

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (data.type === "list_channels") {
      ws.send(
        JSON.stringify({
          type: "channels",
          id: data.id,
          message: {
            id: data.id,
            result: {
              channels: getChannelsSnapshot(),
            },
          },
        })
      );
      return;
    }

    if (data.type === "update_meta") {
      const nextMeta = normalizeMeta(data.meta);
      ws._meta = { ...ws._meta, ...nextMeta };
      return;
    }

    if (data.type === "join") {
      const ch = data.channel;
      if (!ch || typeof ch !== "string") {
        ws.send(
          JSON.stringify({ type: "error", message: "Channel name is required" })
        );
        return;
      }

      if (typeof data.role === "string" && VALID_ROLES.has(data.role)) {
        ws._role = data.role;
      }
      if (data.meta && typeof data.meta === "object") {
        ws._meta = { ...ws._meta, ...normalizeMeta(data.meta) };
      }

      if (ws._channel !== ch) {
        // A repeated join must not leave the socket in the old channel.
        leaveChannel(ws);
        if (!channels.has(ch)) channels.set(ch, new Set());
        channels.get(ch).add(ws);
        ws._channel = ch;
        ws._joinedAt = Date.now();
      }

      const set = channels.get(ch);
      const summary = getChannelSummary(ch, set);
      const docTag = summary.docName ? ` · doc="${summary.docName}"` : "";
      console.log(
        `[relay] joined channel "${ch}" (role=${ws._role}, ${summary.clientCount} client(s), ${summary.pluginCount} plugin(s)${docTag})`
      );
      ws.send(
        JSON.stringify({
          type: "system",
          message: `Joined channel: ${ch}`,
          channel: ch,
        })
      );
      ws.send(
        JSON.stringify({
          type: "system",
          message: {
            id: data.id,
            result: "Connected to channel: " + ch,
            peers: Math.max(0, summary.clientCount - 1),
            pluginCount: summary.pluginCount,
            docName: summary.docName,
            pageName: summary.pageName,
          },
          channel: ch,
        })
      );
      for (const client of set) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "system",
              message: "A new user has joined the channel",
              channel: ch,
            })
          );
        }
      }
      return;
    }

    if (data.type === "message") {
      const ch = data.channel;
      if (!ch || typeof ch !== "string") {
        ws.send(
          JSON.stringify({ type: "error", message: "Channel name is required" })
        );
        return;
      }
      const set = channels.get(ch);
      if (!set || !set.has(ws)) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "You must join the channel first",
          })
        );
        return;
      }
      let peers = 0;
      let executablePeers = 0;
      for (const client of set) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          peers++;
          if (client._role === "plugin" || client._role === "unknown") {
            executablePeers++;
          }
          client.send(
            JSON.stringify({
              type: "broadcast",
              message: data.message,
              sender: "peer",
              channel: ch,
            })
          );
        }
      }
      const cmd =
        data.message && data.message.command
          ? ` · ${data.message.command}`
          : "";
      console.log(
        `[relay] ${
          peers ? `broadcast to ${peers} peer(s)` : "no other peer in channel"
        } (channel ${ch}${cmd}${data.id ? ` · id=${data.id}` : ""})`
      );

      // Fast-fail commands when no Figma plugin (or legacy unknown peer) is online in the channel.
      if (executablePeers === 0 && data.message && data.message.command) {
        const reqId = data.message.id || data.id;
        if (reqId && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "broadcast",
              sender: "relay",
              channel: ch,
              message: {
                id: reqId,
                error: `No Figma plugin peer connected in channel "${ch}"`,
                code: "NO_PEER",
                result: {},
              },
            })
          );
        }
      }
      return;
    }

    if (data.type === "progress_update") {
      const ch = data.channel;
      if (!ch) return;
      const set = channels.get(ch);
      if (!set || !set.has(ws)) return;
      for (const client of set) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });

  ws.on("close", () => {
    leaveChannel(ws);
    console.log("[relay] client disconnected");
  });

  ws.on("error", (err) => {
    console.error("[relay] socket error:", err.message);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(
    `[relay] Agent to Figma relay listening on ws://${HOST}:${PORT} (HTTP: http://${HOST}:${PORT}/channels)`
  );
});
