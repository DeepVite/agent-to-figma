#!/usr/bin/env node
// Register Agent to Figma as an MCP server in the local configs of common
// agent harnesses. Dry-run by default; pass --write to apply.
//
// Usage:
//   node scripts/setup-clients.mjs --list
//   node scripts/setup-clients.mjs --all
//   node scripts/setup-clients.mjs --all --write
//   node scripts/setup-clients.mjs --client codex --write
//   node scripts/setup-clients.mjs --install-skill
//   node scripts/setup-clients.mjs --install-skill --write
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverPath = path.join(repoRoot, "dist", "server.js");
const serverArg = serverPath.replace(/\\/g, "/");
const skillSrcDir = path.join(repoRoot, "skills", "agent-to-figma");
const home = os.homedir();
const skillDestDir = path.join(home, ".agents", "skills", "agent-to-figma");
const isWin = process.platform === "win32";
const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
const macSupport = path.join(home, "Library", "Application Support");
const platformSupport = isWin ? appData : macSupport;

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const listOnly = argv.includes("--list");
const all = argv.includes("--all");
const force = argv.includes("--force");
const installSkill = argv.includes("--install-skill");
const hasClientFlag = argv.includes("--client");
const clientFilter = argValue("--client");

const SERVER_NAME = "agent-to-figma";
const stdio = (extra = {}) => ({
  command: "node",
  args: [serverArg],
  ...extra,
});

function argValue(flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return null;
  const val = argv[i + 1];
  return val && !val.startsWith("-") ? val : null;
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function backup(file) {
  if (!exists(file)) return null;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "");
  const dest = `${file}.bak-${stamp}`;
  fs.copyFileSync(file, dest);
  return dest;
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function applyJson(file, mutate) {
  const existing = exists(file);
  const original = readJson(file);
  if (existing && original === null) {
    throw new Error("existing file is not valid JSON; refusing to overwrite");
  }
  const data = original ? structuredClone(original) : {};
  mutate(data);
  const before = JSON.stringify(original);
  const after = JSON.stringify(data);
  if (before === after) return { status: "unchanged" };
  if (!write) return { status: "would update" };
  const bak = backup(file);
  writeText(file, JSON.stringify(data, null, 2) + "\n");
  return { status: "updated", backup: bak };
}

function applyText(file, build) {
  const original = readText(file);
  const next = build(original);
  if (next === original) return { status: "unchanged" };
  if (!write) return { status: "would update" };
  const bak = backup(file);
  writeText(file, next);
  return { status: "updated", backup: bak };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertOrReplaceTomlSection(text, sectionName, body) {
  const section = `[${sectionName}]`;
  const block = `${section}\n${body.trim()}\n`;
  const re = new RegExp(
    `(^|\\r?\\n)\\[${escapeRegExp(sectionName)}\\][ \\t]*(?:\\r?\\n[\\s\\S]*?)?(?=\\r?\\n\\[|$)`
  );
  if (!re.test(text)) {
    const next = `${text.trimEnd()}\n\n${block}`.replace(/^\n+/, "");
    return next.endsWith("\n") ? next : `${next}\n`;
  }
  const next = text.replace(re, (match, prefix, offset, full) => {
    const after = full.slice(offset + match.length);
    const bodyOut =
      after.startsWith("\n[") || after.startsWith("\r\n[")
        ? block
        : block.trimEnd();
    return `${prefix}${bodyOut}`;
  });
  return next.endsWith("\n") ? next : `${next}\n`;
}

const clients = [
  {
    id: "claude-code",
    name: "Claude Code",
    target: () => path.join(home, ".claude.json"),
    detect: () => exists(path.join(home, ".claude.json")),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = stdio();
      }),
  },
  {
    id: "codex",
    name: "Codex",
    target: () => path.join(home, ".codex", "config.toml"),
    detect: () =>
      exists(path.join(home, ".codex", "config.toml")) ||
      exists(path.join(home, ".codex")),
    apply: (file) =>
      applyText(file, (text) =>
        insertOrReplaceTomlSection(
          text,
          `mcp_servers.${SERVER_NAME}`,
          `command = "node"\nargs = ["${serverArg}"]`
        )
      ),
  },
  {
    id: "cursor",
    name: "Cursor",
    target: () => path.join(home, ".cursor", "mcp.json"),
    detect: () =>
      exists(path.join(home, ".cursor")) ||
      exists(path.join(platformSupport, "Cursor")) ||
      (isWin && exists(path.join(home, "AppData", "Roaming", "Cursor"))),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = stdio();
      }),
  },
  {
    id: "trae",
    name: "Trae / Trae CN",
    targets: () => {
      const roots = isWin
        ? [path.join(appData, "Trae CN"), path.join(appData, "Trae")]
        : [
            path.join(macSupport, "Trae CN"),
            path.join(macSupport, "Trae"),
          ];
      return roots
        .filter((root) => exists(root))
        .map((root) => path.join(root, "User", "mcp.json"));
    },
    detect: () => {
      const roots = isWin
        ? [path.join(appData, "Trae CN"), path.join(appData, "Trae")]
        : [
            path.join(macSupport, "Trae CN"),
            path.join(macSupport, "Trae"),
          ];
      return roots.some((root) => exists(root));
    },
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = {
          command: "node",
          args: [serverArg],
          env: {},
          type: "stdio",
        };
      }),
  },
  {
    id: "dsh",
    name: "dsh (DeepSeek Harness)",
    targets: () => {
      const dshHome = process.env.DSH_HOME || path.join(home, ".dsh");
      const profilesDir = path.join(dshHome, "profiles");
      const targets = [];
      if (exists(profilesDir)) {
        for (const profile of fs.readdirSync(profilesDir)) {
          const file = path.join(profilesDir, profile, "cordis.patch.yml");
          if (exists(file)) targets.push(file);
        }
      }
      if (!targets.length) {
        targets.push(path.join(dshHome, "cordis.patch.yml"));
      }
      return targets;
    },
    detect: () =>
      exists(process.env.DSH_HOME || path.join(home, ".dsh")) ||
      exists(path.join(platformSupport, "@deepseek-ai", "dsh-desktop")),
    apply: (file) =>
      applyText(file, (text) => {
        if (text.includes(`serverName: ${SERVER_NAME}`)) return text;
        const firstContentLine = text
          .split("\n")
          .map((line) => line.trim())
          .find((line) => line && !line.startsWith("#"));
        if (firstContentLine && !firstContentLine.startsWith("-")) {
          throw new Error(
            "cordis.patch.yml does not look like a top-level YAML array; add the entry manually"
          );
        }
        const entry = [
          `- id: mcp-${SERVER_NAME.toLowerCase()}`,
          "  name: '@deepseek-ai/dsh-mcp-client'",
          "  config:",
          `    serverName: ${SERVER_NAME}`,
          "    transport: stdio",
          "    command: node",
          "    args:",
          `      - '${serverArg}'`,
          "    env: {}",
          "    toolCallTimeoutMs: 120000",
          "",
        ].join("\n");
        return `${text.trimEnd()}\n${text.trim() ? "\n" : ""}${entry}`;
      }),
  },
  {
    id: "zcode",
    name: "ZCode",
    target: () => path.join(home, ".zcode", "cli", "config.json"),
    detect: () => exists(path.join(home, ".zcode", "cli", "config.json")),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcp = j.mcp || {};
        j.mcp.servers = j.mcp.servers || {};
        j.mcp.servers[SERVER_NAME] = {
          type: "stdio",
          command: "node",
          args: [serverArg],
        };
      }),
  },
  {
    id: "workbuddy",
    name: "WorkBuddy",
    target: () => path.join(home, ".workbuddy", "mcp.json"),
    detect: () =>
      exists(path.join(home, ".workbuddy", "mcp.json")) ||
      exists(path.join(home, ".workbuddy")),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = {
          type: "stdio",
          command: "node",
          args: [serverArg],
          timeout: 60000,
        };
      }),
  },
  {
    id: "antigravity-app",
    name: "Antigravity App",
    target: () => path.join(home, ".gemini", "config", "mcp_config.json"),
    detect: () => exists(path.join(home, ".gemini", "antigravity")),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = stdio();
      }),
  },
  {
    id: "antigravity-cli",
    name: "Antigravity CLI (agy)",
    target: () => path.join(home, ".gemini", "config", "mcp_config.json"),
    detect: () => exists(path.join(home, ".gemini", "antigravity-cli")),
    apply: (file) =>
      applyJson(file, (j) => {
        j.mcpServers = j.mcpServers || {};
        j.mcpServers[SERVER_NAME] = stdio();
      }),
  },
];

function targetsFor(client) {
  if (typeof client.targets === "function") return client.targets();
  return [client.target()];
}

function collectFiles(rootDir, relBase = "") {
  const out = new Map();
  if (!exists(rootDir)) return out;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      for (const [k, v] of collectFiles(full, rel)) out.set(k, v);
    } else if (entry.isFile()) {
      out.set(rel, fs.readFileSync(full));
    }
  }
  return out;
}

function applySkill() {
  if (!exists(skillSrcDir)) {
    throw new Error(`skill source not found at ${skillSrcDir}`);
  }
  const srcFiles = collectFiles(skillSrcDir);
  const dstFiles = collectFiles(skillDestDir);
  let same = srcFiles.size === dstFiles.size;
  if (same) {
    for (const [rel, buf] of srcFiles) {
      const dstBuf = dstFiles.get(rel);
      if (!dstBuf || !buf.equals(dstBuf)) {
        same = false;
        break;
      }
    }
  }
  if (same) return { status: "unchanged" };
  if (!write) return { status: "would update" };
  let bak = null;
  if (exists(skillDestDir)) {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "");
    bak = `${skillDestDir}.bak-${stamp}`;
    fs.cpSync(skillDestDir, bak, { recursive: true });
    fs.rmSync(skillDestDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(skillDestDir), { recursive: true });
  fs.cpSync(skillSrcDir, skillDestDir, { recursive: true });
  return { status: "updated", backup: bak };
}

function main() {
  const runClients = !installSkill || all || hasClientFlag;

  if (runClients && !exists(serverPath)) {
    console.error(`[setup] dist/server.js not found at ${serverPath}`);
    console.error("[setup] Run `npm install && npm run build` first.");
    process.exit(1);
  }

  if (hasClientFlag) {
    const validIds = clients.map((c) => c.id);
    if (!clientFilter || !validIds.includes(clientFilter)) {
      console.error(
        `[setup] Invalid or missing --client value${clientFilter ? `: "${clientFilter}"` : ""}.`
      );
      console.error(`[setup] Supported clients: ${validIds.join(", ")}`);
      process.exit(1);
    }
  }

  const selected = clients.filter(
    (c) => (all && !clientFilter) || !clientFilter || c.id === clientFilter
  );

  if (listOnly) {
    for (const c of clients) {
      console.log(`${c.id.padEnd(16)} ${c.name.padEnd(24)} detected=${c.detect()}`);
    }
    console.log(
      `${"skill".padEnd(16)} ${"~/.agents/skills".padEnd(24)} installed=${exists(path.join(skillDestDir, "SKILL.md"))}`
    );
    return;
  }

  console.log(
    write
      ? "Applying configuration (backups will be created)..."
      : "Dry run. Pass --write to apply. Showing targets only.\n"
  );

  let changed = 0;
  if (runClients) {
    for (const c of selected) {
      if (!c.detect() && !force) {
        console.log(`SKIP  ${c.name}: not detected (use --force to write anyway)`);
        continue;
      }
      const targets = targetsFor(c);
      if (!targets.length) {
        console.log(`SKIP  ${c.name}: no config path found`);
        continue;
      }
      for (const file of targets) {
        let result;
        try {
          result = c.apply(file);
        } catch (e) {
          result = { status: `error: ${e.message}` };
        }
        if (result.status === "updated" || result.status === "would update") changed++;
        const bak = result.backup ? ` (backup: ${result.backup})` : "";
        console.log(`${result.status.padEnd(12)} ${c.name}: ${file}${bak}`);
      }
    }
  }

  if (installSkill) {
    let result;
    try {
      result = applySkill();
    } catch (e) {
      result = { status: `error: ${e.message}` };
    }
    if (result.status === "updated" || result.status === "would update") changed++;
    const bak = result.backup ? ` (backup: ${result.backup})` : "";
    console.log(`${result.status.padEnd(12)} Agent Skill: ${skillDestDir}${bak}`);
  }

  console.log(
    `\n${write ? "Applied" : "Would apply"} ${changed} target(s).`
  );
  if (!write) console.log("Re-run with --write to apply.");
}

main();
