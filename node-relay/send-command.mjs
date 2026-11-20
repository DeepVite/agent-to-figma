#!/usr/bin/env node
// Direct command sender: talks to the plugin over the relay and bypasses the
// MCP tool list, so commands the MCP server does not expose (create_page,
// set_parent, create_section, scan_all_text, ...) can still be called.
//
// Usage: node send-command.mjs <channel> <command> ['{"param":"value"}']
import WebSocket from "ws";

const [channel, command, paramsRaw] = process.argv.slice(2);
if (!channel || !command) {
  console.error(
    'Usage: node send-command.mjs <channel> <command> [\'{"param":"value"}\']'
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
const id =
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
let joined = false;

// Join first: the relay only forwards messages from joined sockets.
ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join", channel, id }));
});

const timer = setTimeout(() => {
  console.error(
    `Timeout: no response for "${command}" in 20s. Check: (1) is the relay running? (2) is the Figma plugin connected? (3) is the channel name correct?`
  );
  process.exit(2);
}, 20000);

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
      console.error(`[joined ${channel}, sent ${command}]`);
    } else if (d.type === "error") {
      console.error("Join failed: " + d.message);
      process.exit(2);
    }
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
