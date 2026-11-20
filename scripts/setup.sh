#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

MCP_CONFIG='{
  "mcpServers": {
    "TalkToFigma": {
      "command": "npx",
      "args": ["-y", "cursor-talk-to-figma-mcp@latest"]
    }
  }
}'

npm install --omit=dev

# MCP clients that read a project-level config (Claude Code, Cursor, ...)
mkdir -p .cursor
echo "$MCP_CONFIG" > .cursor/mcp.json
echo "MCP config written to .cursor/mcp.json"
echo "$MCP_CONFIG" > .mcp.json
echo "MCP config written to .mcp.json"

cat <<'EOF'

Setup complete. Next steps:
  1. Start the relay:   npm run relay
  2. In Figma desktop:  Plugins -> Development -> Import plugin from manifest...
                        choose src/cursor_mcp_plugin/manifest.json
  3. Run the plugin and copy the channel name printed by the relay.
  4. In your MCP client, call join_channel with that channel name.
EOF
