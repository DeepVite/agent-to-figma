#!/usr/bin/env node
// Relay self-test: two clients in one channel verify the join reply, the
// "new user joined" notice, broadcast delivery, and no echo to the sender.
//
// Usage: node test-relay.mjs   (start socket.mjs first)
import WebSocket from "ws";

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;
const url = `ws://127.0.0.1:${PORT}`;
const log = (...a) => console.log("[test]", ...a);

function client(name, inbox = []) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => resolve({ ws, name, inbox }));
    ws.on("error", reject);
    ws.on("message", (raw) => {
      inbox.push(JSON.parse(raw.toString()));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const a = await client("A");
a.ws.send(JSON.stringify({ type: "join", channel: "selftest", id: "join-a" }));
await sleep(300);

const b = await client("B");
b.ws.send(JSON.stringify({ type: "join", channel: "selftest", id: "join-b" }));
await sleep(300);

// A sends a command; B should receive the broadcast.
a.ws.send(
  JSON.stringify({
    type: "message",
    channel: "selftest",
    id: "cmd-1",
    message: { command: "get_document_info" },
  })
);
await sleep(400);

const aJoin = a.inbox.find((d) => d.type === "system" && d.message?.result);
const aNotify = a.inbox.find(
  (d) => d.type === "system" && d.message === "A new user has joined the channel"
);
const bBroadcast = b.inbox.find(
  (d) => d.type === "broadcast" && d.message?.command === "get_document_info"
);
const aEcho = a.inbox.find((d) => d.type === "broadcast");

log("A join reply:", aJoin?.message?.result ?? "MISSING");
log("A saw new-user notice:", aNotify ? "yes" : "no");
log("B received broadcast:", bBroadcast ? "yes" : "no");
log("A got no echo:", aEcho ? "FAILED (echo received)" : "yes");

const pass = Boolean(aJoin && aNotify && bBroadcast && !aEcho);
console.log(pass ? "=== PASS ===" : "=== FAIL ===");
a.ws.close();
b.ws.close();
process.exit(pass ? 0 : 1);
