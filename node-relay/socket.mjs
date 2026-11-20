#!/usr/bin/env node
// Minimal Node.js WebSocket relay for the Agent to Figma Bridge plugin.
// Protocol-compatible with the Bun relay shipped in grab/cursor-talk-to-figma-mcp:
//   join            -> two system replies + "new user" notice to the channel
//   message         -> {type:"broadcast", sender:"peer"} to other clients (no echo)
//   progress_update -> forwarded as-is to other clients
//
// Env:
//   FIGMA_RELAY_PORT  listen port (default 3055)
//   FIGMA_RELAY_HOST  bind address (default 127.0.0.1)
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;
const HOST = process.env.FIGMA_RELAY_HOST || "127.0.0.1";
const channels = new Map(); // channel -> Set<ws>

const wss = new WebSocketServer({ port: PORT, host: HOST });

wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[relay] port ${PORT} is already in use. Stop the other relay or set FIGMA_RELAY_PORT.`
    );
  } else {
    console.error("[relay] server error:", err.message);
  }
  process.exit(1);
});

function leaveChannel(ws) {
  const ch = ws._channel;
  if (!ch) return;
  const set = channels.get(ch);
  if (set) {
    set.delete(ws);
    if (set.size === 0) channels.delete(ch);
    console.log(`[relay] client left channel "${ch}"`);
  }
  ws._channel = null;
}

wss.on("connection", (ws) => {
  ws._channel = null;
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

    if (data.type === "join") {
      const ch = data.channel;
      if (!ch || typeof ch !== "string") {
        ws.send(
          JSON.stringify({ type: "error", message: "Channel name is required" })
        );
        return;
      }

      if (ws._channel !== ch) {
        // A repeated join must not leave the socket in the old channel.
        leaveChannel(ws);
        if (!channels.has(ch)) channels.set(ch, new Set());
        channels.get(ch).add(ws);
        ws._channel = ch;
      }

      console.log(
        `[relay] joined channel "${ch}" (${channels.get(ch).size} client(s))`
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
          message: { id: data.id, result: "Connected to channel: " + ch },
          channel: ch,
        })
      );
      for (const client of channels.get(ch)) {
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
      for (const client of set) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          peers++;
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

console.log(
  `[relay] Agent to Figma relay listening on ws://${HOST}:${PORT}`
);
