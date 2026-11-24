---
name: agent-to-figma
description: Use this skill whenever reading, inspecting, editing, annotating, creating pages/nodes, or batch-replacing text in Figma Desktop via the local `agent-to-figma` MCP bridge and CLI (`node-relay/send-command.mjs`, `batch-replace.mjs`), or when troubleshooting Figma relay/plugin/channel issues (timeouts, port 3055, dynamic-page, single-page bug, plugin UI not updating). Covers connection startup order, safe canvas rules (`create_page` before writing), tool reference, and pitfalls only.
---

# Agent to Figma

Local bridge for reading and editing an open **Figma Desktop** document via MCP (`agent-to-figma`, 45 tools) and direct CLI (`node-relay/send-command.mjs`, covering `create_page` and `scan_all_text`).

> **Do not** try Figma's official remote MCP (`https://mcp.figma.com/mcp`) as a fallback for editing — it requires allowlisted OAuth / paid seats and is separate from this local bridge.
>
> **Scope**: This repository and skill cover connectivity, execution safety, and troubleshooting only — no layout, styling, or copy templates are enforced. Optional visual/spec presets live in the separate repository [`agent-to-figma-skills`](https://github.com/DeepVite/agent-to-figma-skills).

---

## 1. Preflight & Startup Order

All **3 components** must be running in strict order: **Relay → Figma Plugin → MCP `join_channel`**.

1. **Relay (`127.0.0.1:3055` by default)**:
   - Check if port `3055` (or `FIGMA_RELAY_PORT`) is listening.
   - If not running, start `npm run relay` (or `node <agent-to-figma-repo>/node-relay/socket.mjs`) and keep it alive in the background.
   - Never bind the relay to `0.0.0.0` (relay has no auth; loopback only).
2. **Figma Desktop + Dev Plugin**:
   - Figma Desktop must remain open (minimized is fine; quitting stops the bridge).
   - Run `Plugins → Development → Agent to Figma` (`Open Panel` or `Silent Connect`).
   - The plugin can be collapsed to a `212×44` mini bar or hidden to silent mode (bottom `Open Panel` bar), but must **not** be closed. Re-run after every Figma restart.
3. **Channel Handshake (Zero-Copy Auto-Discovery)**:
   - **Single canvas (default)**: call `get_document_info()` directly (or `join_channel()` without arguments). The MCP server auto-discovers and joins the sole active plugin channel, and silently switches + retries if the plugin restarts on a new channel.
   - **Multiple canvases**: MCP refuses to guess and returns `[channel + documentName]` choices. Call `list_channels()`, ask the user which file to target, then call `join_channel({ channel })`.
   - Never guess or hardcode a random channel name; if using an older relay without discovery, read the channel from the plugin UI's channel card or relay log.

---

## 2. Hard Safety Rules

1. **Never write directly onto an existing user page**: always create an isolated page first via CLI `create_page`, unless the user explicitly asks to edit an existing page/node.
2. **Read before mutating**: inspect with `get_document_info`, `get_selection`, `read_my_design`, or `get_node_info` before modifying existing nodes.
3. **Confirm destructive operations**: ask explicit confirmation before `delete_node`, `delete_multiple_nodes`, or overwriting existing user content.
4. **Verify URLs before replacing**: when replacing links/domains in Figma, verify the new URL responds HTTP 200 before running batch replacements.
5. **Never fake shell capabilities**: `create_page` and `scan_all_text` are plugin-only commands not exposed in the 45 MCP tools. If you do not have shell access to run `node-relay/send-command.mjs`, tell the user clearly.
6. **Always verify after writing**: re-check modified nodes (`get_node_info` / `get_nodes_info` / `scan_all_text`), export PNG with `export_node_as_image` for visual QA on complex layouts, and focus the viewport with `set_focus(nodeId)`.

---

## 3. Core Workflow & Tool Quick Reference

### 3.1 MCP Tools (45 tools, stdio `agent-to-figma`)

| Category | Key Tools |
|---|---|
| Connection (2) | `list_channels`, `join_channel` |
| Read & Scan (10) | `get_document_info`, `get_selection`, `read_my_design`, `get_node_info`, `get_nodes_info`, `get_styles`, `get_local_components`, `scan_text_nodes`, `scan_nodes_by_types`, `export_node_as_image` |
| Create & Layout (14) | `create_frame`, `create_rectangle`, `create_text`, `create_section`, `create_component_instance`, `clone_node`, `move_node`, `resize_node`, `set_parent`, `set_layout_mode`, `set_padding`, `set_axis_align`, `set_layout_sizing`, `set_item_spacing` |
| Style & Content (9) | `set_fill_color`, `set_stroke_color`, `set_corner_radius`, `set_image_fill`, `set_text_content`, `set_multiple_text_contents`, `rename_node`, `delete_node`, `delete_multiple_nodes` |
| Overrides, Annotations & Flow (10) | `get_instance_overrides`, `set_instance_overrides`, `get_annotations`, `set_annotation`, `set_multiple_annotations`, `get_reactions`, `set_default_connector`, `create_connections`, `set_focus`, `set_selections` |

- Colors use **0–1 RGBA floats** (`{ r, g, b, a }`).
- Prefer batch tools (`set_multiple_text_contents`, `delete_multiple_nodes`, `set_multiple_annotations`) for bulk updates.

### 3.2 Direct CLI (Plugin Commands Not in MCP)

Run from the `agent-to-figma` repository (or pass full script path):

```bash
# Create an isolated page and switch to it (`auto` resolves the sole active canvas; pass `<channel>` when multiple files are open)
node node-relay/send-command.mjs auto create_page '{"name":"Agent Draft"}'

# Scan text across all pages (optional substring filter)
node node-relay/send-command.mjs auto scan_all_text '{"contains":"old.example.com"}'

# Cross-page literal batch replace (scan -> replace -> rescan)
node node-relay/batch-replace.mjs auto "old.example.com" "new.example.com" [exclude]

# Pass non-ASCII / complex JSON via file (avoids Windows shell quoting issues; supports UTF-8 & UTF-16LE BOM)
node node-relay/send-command.mjs auto rename_node @params.json
```

---

## 4. High-Frequency Pitfalls (Summary)

Read [`references/pitfalls.md`](references/pitfalls.md) when hitting errors. Most common traps:

| Symptom | Root Cause & Fix |
|---|---|
| Command times out (20–30s) | No plugin peer in that channel. Verify relay is running, plugin is connected, and channel matches latest relay log. |
| `get_document_info` returns only 1 page | Loaded an older/community plugin instead of this repo's `manifest.json`. |
| Plugin UI/version didn't change after `git pull` | Figma Desktop still points to an older clone's `manifest.json` (`Plugins → Development`: remove old entry, re-import current `manifest.json`, close & re-run plugin). |
| `create_frame` with `a: 0` becomes opaque | Upstream `parseFloat(fillColor.a) \|\| 1` turns `0` into `1`; omit `fillColor` or match parent background instead. |
| `set_corner_radius` with mixed `corners` throws `Cannot unwrap symbol` | Figma returns `figma.mixed` Symbol when corners differ; use uniform `radius` + parent frame `clipsContent` instead. |
| `export_node_as_image` always returns PNG | Plugin hardcodes `format = "PNG"` and returns base64 (does not write disk). |

---

## 5. Delivery Report Format

After completing a Figma task, concisely report:
- **Target**: page name & page ID
- **Changes**: created/modified node IDs (before → after for edits)
- **Verification**: `get_node_info` / `scan_all_text` remaining count / exported PNG check
- **Limitations** (if any): e.g., no shell available for `create_page`
