#!/usr/bin/env node
// Direct command sender: talks to the plugin over the relay and bypasses the
// MCP tool list, so commands the MCP server does not expose (create_page,
// scan_all_text, ...) can still be called.
//
// Usage: node send-command.mjs <channel|auto> <command> ['{"param":"value"}' | @params.json]
import fs from "node:fs";
import WebSocket from "ws";

let [channel, command, paramsRaw] = process.argv.slice(2);

// Allow `@path/to/params.json` so non-ASCII payloads survive shells that
// mangle command-line encoding (e.g. Git Bash or PowerShell on Windows).
if (paramsRaw?.startsWith("@")) {
  const filePath = paramsRaw.slice(1);
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (e) {
    console.error(`Failed to read params file "${filePath}": ${e.message}`);
    process.exit(1);
  }
  // Support UTF-16LE (PowerShell 5.1 default) as well as UTF-8 (with or without BOM).
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    paramsRaw = buf.subarray(2).toString("utf16le");
  } else {
    paramsRaw = buf.toString("utf8").replace(/^\uFEFF/, "");
  }
}
if (!channel || !command) {
  console.error(
    'Usage: node send-command.mjs <channel|auto> <command> [\'{"param":"value"}\' | @params.json]'
  );
  process.exit(1);
}

let params = {};
if (paramsRaw) {
  try {
    params = JSON.parse(paramsRaw);
  } catch (e) {
    console.error("Invalid params JSON: " + e.message);
    process.exit(1);
  }
}

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;

async function resolveAutoChannel(port) {
  let res;
  try {
    res = await fetch(`http://127.0.0.1:${port}/channels`, {
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.error(
      `Cannot query relay channels on http://127.0.0.1:${port}/channels (is the relay running?): ${e.message}`
    );
    process.exit(2);
  }
  if (!res.ok) {
    console.error(
      `Relay HTTP /channels returned ${res.status}. Update/restart relay or pass an explicit channel.`
    );
    process.exit(2);
  }
  const body = await res.json();
  const all = Array.isArray(body?.channels) ? body.channels : [];
  let candidates = all.filter((c) => c.pluginCount > 0);
  if (candidates.length === 0) {
    candidates = all.filter((c) => (c.unknownCount || 0) > 0 && c.clientCount > 0);
  }
  if (candidates.length === 1) {
    const pick = candidates[0];
    const docTag = pick.docName ? ` ("${pick.docName}")` : "";
    console.error(`[auto-selected channel ${pick.channel}${docTag}]`);
    return pick.channel;
  }
  if (candidates.length === 0) {
    console.error(
      "Relay is running, but no active Figma plugin canvas is connected. Run Agent to Figma in Figma Desktop first."
    );
    process.exit(2);
  }
  console.error(
    `Multiple active Figma canvases (${candidates.length}) are connected; refusing to guess. Pass an explicit channel:`
  );
  for (const c of candidates) {
    const doc = c.docName ? `"${c.docName}"` : "(untitled)";
    const page = c.pageName ? ` (page: ${c.pageName})` : "";
    console.error(`  - ${c.channel} — ${doc}${page}`);
  }
  process.exit(2);
}

if (channel.toLowerCase() === "auto") {
  channel = await resolveAutoChannel(PORT);
}

const id =
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
let joined = false;

// Join first: the relay only forwards messages from joined sockets.
ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join", channel, id, role: "cli" }));
});

const TIMEOUT_MS = 20000;
let timer;
function resetTimer() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.error(
      `Timeout: no response for "${command}" in ${TIMEOUT_MS / 1000}s. Check: (1) is the relay running? (2) is the Figma plugin connected? (3) is the channel name correct?`
    );
    process.exit(2);
  }, TIMEOUT_MS);
}
resetTimer();

ws.on("message", (raw) => {
  let d;
  try {
    d = JSON.parse(raw.toString());
  } catch {
    return;
  }
  if (!joined) {
    if (d.type === "system" && d.message?.result) {
      joined = true;
      ws.send(
        JSON.stringify({
          id,
          type: "message",
          channel,
          message: { id, command, params },
        })
      );
      resetTimer();
      console.error(`[joined ${channel}, sent ${command}]`);
    } else if (d.type === "error") {
      console.error("Join failed: " + d.message);
      process.exit(2);
    }
    return;
  }
  if (d.type === "progress_update" && d.id === id) {
    resetTimer();
    return;
  }
  if (d.type === "broadcast" && d.message?.id === id) {
    clearTimeout(timer);
    const m = d.message;
    if (m.error) {
      console.error("Plugin error: " + m.error);
      process.exit(3);
    }
    console.log(JSON.stringify(m.result, null, 2));
    process.exit(0);
  }
});

ws.on("error", (e) => {
  console.error("WebSocket connection failed (is the relay running?): " + e.message);
  process.exit(2);
});
