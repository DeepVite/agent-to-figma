# Node.js runtime for the MCP server. The relay and Figma plugin run on the host.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY dist ./dist

# The MCP server speaks stdio; run it with `docker run -i`.
CMD ["node", "dist/server.js"]
