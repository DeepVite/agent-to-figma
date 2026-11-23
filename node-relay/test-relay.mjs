#!/usr/bin/env node
// Relay self-test: verifies legacy join/broadcast/no-echo compatibility PLUS
// HTTP GET /channels & /health, WS list_channels, role/meta/update_meta, and NO_PEER fast-fail.
//
// Usage: node test-relay.mjs   (start socket.mjs first, or set FIGMA_RELAY_PORT)
import WebSocket from "ws";

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;
const wsUrl = `ws://127.0.0.1:${PORT}`;
const httpBase = `http://127.0.0.1:${PORT}`;
const log = (...a) => console.log("[test]", ...a);

function client(name, inbox = []) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on("open", () => resolve({ ws, name, inbox }));
    ws.on("error", reject);
    ws.on("message", (raw) => {
      inbox.push(JSON.parse(raw.toString()));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Legacy protocol check (no role / meta) + broadcast + no echo
const a = await client("A");
a.ws.send(JSON.stringify({ type: "join", channel: "selftest", id: "join-a" }));
await sleep(200);

const b = await client("B");
b.ws.send(JSON.stringify({ type: "join", channel: "selftest", id: "join-b" }));
await sleep(200);

a.ws.send(
  JSON.stringify({
    type: "message",
    channel: "selftest",
    id: "cmd-1",
    message: { id: "cmd-1", command: "get_document_info" },
  })
);
await sleep(250);

const aJoin = a.inbox.find((d) => d.type === "system" && d.message?.result);
const aNotify = a.inbox.find(
  (d) => d.type === "system" && d.message === "A new user has joined the channel"
);
const bBroadcast = b.inbox.find(
  (d) => d.type === "broadcast" && d.message?.command === "get_document_info"
);
const aEcho = a.inbox.find((d) => d.type === "broadcast");

// 2. Plugin role + meta + update_meta + HTTP /channels + WS list_channels
const plugin = await client("Plugin");
plugin.ws.send(
  JSON.stringify({
    type: "join",
    channel: "plug1234",
    id: "join-p",
    role: "plugin",
    meta: { docName: "Test Doc", pageName: "Page 1" },
  })
);
await sleep(200);

plugin.ws.send(
  JSON.stringify({
    type: "update_meta",
    channel: "plug1234",
    meta: { pageName: "Page 2" },
  })
);
await sleep(150);

const httpHealth = await fetch(`${httpBase}/health`).then((r) => r.json());
const httpChannels = await fetch(`${httpBase}/channels`).then((r) => r.json());
const httpPluginEntry = (httpChannels.channels || []).find(
  (c) => c.channel === "plug1234"
);

const probe = await client("Probe");
probe.ws.send(JSON.stringify({ type: "list_channels", id: "ls-1" }));
await sleep(200);
const wsListMsg = probe.inbox.find(
  (d) => d.type === "channels" && d.message?.id === "ls-1"
);
const wsPluginEntry = (wsListMsg?.message?.result?.channels || []).find(
  (c) => c.channel === "plug1234"
);

// 3. NO_PEER fast-fail when sending a command to a solo channel (or MCP-only channel)
const solo = await client("Solo");
solo.ws.send(
  JSON.stringify({ type: "join", channel: "empty999", id: "join-solo", role: "mcp" })
);
const solo2 = await client("Solo2");
solo2.ws.send(
  JSON.stringify({ type: "join", channel: "empty999", id: "join-solo2", role: "mcp" })
);
await sleep(150);
const t0 = Date.now();
solo.ws.send(
  JSON.stringify({
    type: "message",
    channel: "empty999",
    id: "cmd-nopeer",
    message: { id: "cmd-nopeer", command: "get_document_info" },
  })
);
await sleep(200);
const noPeerReply = solo.inbox.find(
  (d) =>
    d.type === "broadcast" &&
    d.message?.id === "cmd-nopeer" &&
    d.message?.code === "NO_PEER"
);
const noPeerLatencyMs = Date.now() - t0;

const checks = [
  ["A join reply", Boolean(aJoin?.message?.result)],
  ["A saw new-user notice", Boolean(aNotify)],
  ["B received broadcast", Boolean(bBroadcast)],
  ["A got no echo", !aEcho],
  ["HTTP /health ok", httpHealth?.ok === true],
  [
    "HTTP /channels plugin meta + update_meta",
    httpPluginEntry?.pluginCount === 1 &&
      httpPluginEntry?.docName === "Test Doc" &&
      httpPluginEntry?.pageName === "Page 2",
  ],
  [
    "WS list_channels plugin meta",
    wsPluginEntry?.pluginCount === 1 && wsPluginEntry?.docName === "Test Doc",
  ],
  [
    "NO_PEER fast-fail even with 2 MCPs & 0 plugins (<1s)",
    Boolean(noPeerReply) && noPeerLatencyMs < 1000,
  ],
];

for (const [label, ok] of checks) {
  log(`${ok ? "PASS" : "FAIL"}: ${label}`);
}

const pass = checks.every(([, ok]) => ok);
console.log(pass ? "=== PASS ===" : "=== FAIL ===");
a.ws.close();
b.ws.close();
plugin.ws.close();
probe.ws.close();
solo.ws.close();
solo2.ws.close();
process.exit(pass ? 0 : 1);
