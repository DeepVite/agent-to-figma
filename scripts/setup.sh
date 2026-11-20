#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

MCP_CONFIG='{
  "mcpServers": {
    "TalkToFigma": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}'

npm install --omit=dev

# Project-level MCP config for Claude Code / Cursor. Global harness configs are
# written by scripts/setup-clients.mjs instead.
mkdir -p .cursor
echo "$MCP_CONFIG" > .cursor/mcp.json
echo "$MCP_CONFIG" > .mcp.json
echo "Project MCP config written to .mcp.json and .cursor/mcp.json"

cat <<'EOF'

Setup complete. Next steps:
  1. Start the relay:   npm run relay
  2. Detect your MCP clients:  npm run setup:clients -- --list
     Write one client config:   npm run setup:clients -- --client codex --write
  3. In Figma desktop:  Plugins -> Development -> Import plugin from manifest...
                        choose src/cursor_mcp_plugin/manifest.json
  4. Run the plugin and copy the channel name shown by the plugin / relay log.
  5. In your MCP client: join_channel(that name), then get_document_info.
EOF
