#!/usr/bin/env node
// Cross-page text replacement: one connection, scan_all_text -> set_text_content
// for every match -> rescan to confirm nothing is left.
//
// Requires the patched plugin in this repository (the scan_all_text command is
// not part of upstream cursor-talk-to-figma-mcp).
//
// Usage: node batch-replace.mjs <channel> <old> <new> [exclude]
import WebSocket from "ws";

const [channel, oldStr, newStr, exclude] = process.argv.slice(2);
if (!channel || !oldStr || newStr === undefined) {
  console.error("Usage: node batch-replace.mjs <channel> <old> <new> [exclude]");
  process.exit(1);
}

const PORT = Number(process.env.FIGMA_RELAY_PORT) || 3055;
const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
const pending = new Map();
let seq = 0;

const call = (command, params) =>
  new Promise((resolve, reject) => {
    const id = `br-${++seq}-${Math.random().toString(36).slice(2, 8)}`;
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`${command} timed out (20s)`));
      }
    }, 20000);
    pending.set(id, {
      resolve: (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    ws.send(
      JSON.stringify({
        id,
        type: "message",
        channel,
        message: { id, command, params },
      })
    );
  });

ws.on("open", () =>
  ws.send(JSON.stringify({ type: "join", channel, id: "join" }))
);

// Do not sit forever if the join reply never arrives.
const joinTimer = setTimeout(() => {
  console.error("Join timed out (10s). Is the relay running and the channel joined?");
  process.exit(2);
}, 10000);

ws.on("message", async (raw) => {
  let d;
  try {
    d = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (
    d.type === "system" &&
    d.message?.result === "Connected to channel: " + channel
  ) {
    clearTimeout(joinTimer);
    try {
      const scan = await call("scan_all_text", { contains: oldStr });
      const items = (scan.matches || []).filter(
        (m) => !(exclude && m.characters.includes(exclude))
      );
      console.log(
        `Scanned ${scan.matchCount} match(es), processing ${items.length}`
      );
      const results = [];
      for (const m of items) {
        const next = m.characters.split(oldStr).join(newStr);
        try {
          await call("set_text_content", { nodeId: m.id, text: next });
          results.push({
            page: m.pageName,
            id: m.id,
            before: m.characters,
            after: next,
            ok: true,
          });
          console.log(`OK   ${m.pageName} · ${m.id}`);
        } catch (e) {
          results.push({
            page: m.pageName,
            id: m.id,
            before: m.characters,
            ok: false,
            error: e.message,
          });
          console.log(`FAIL ${m.pageName} · ${m.id} — ${e.message}`);
        }
      }
      const re = await call("scan_all_text", { contains: oldStr });
      console.log(`\n=== Remaining matches: ${re.matchCount} ===`);
      (re.matches || []).forEach((m) =>
        console.log(`  left: ${m.pageName} · ${m.id} · ${m.characters}`)
      );
      console.log(`\n=== Details ===\n${JSON.stringify(results, null, 2)}`);
      ws.close();
      process.exit(results.every((r) => r.ok) ? 0 : 1);
    } catch (e) {
      console.error("Failed: " + e.message);
      ws.close();
      process.exit(2);
    }
    return;
  }

  if (d.type === "broadcast" && d.message?.id && pending.has(d.message.id)) {
    const { resolve, reject } = pending.get(d.message.id);
    pending.delete(d.message.id);
    if (d.message.error) reject(new Error(d.message.error));
    else resolve(d.message.result);
  }
});

ws.on("error", (e) => {
  console.error("WebSocket connection failed (is the relay running?): " + e.message);
  process.exit(2);
});
