# VTEX MCP (Cursor extension)

Bundles a TypeScript MCP server and auto-registers it with Cursor when the **open project account** has saved credentials.

## Build & install

```bash
npm install
npm run compile
npx @vscode/vsce package --no-dependencies --allow-missing-repository
cursor --install-extension vtex-mcp-0.3.1.vsix --force
```

Or **Extensions: Install from Location…** → this folder.

Requires **Node.js 20+** on PATH.

## Usage

1. Open a FastStore or IO project
2. **VTEX: Add Account** for that project’s `storeId` / vendor
3. MCP appears as `extension-vtex` — inactive (unregistered) until credentials match the project
4. **VTEX: Re-register MCP** after switching folders

See the repository root README for the tool map.

## Standalone / Claude Code

No extension required — same `out-mcp/index.js` with `~/.vtex-mcp/accounts.json`. See root [README Option B](../README.md#option-b--standalone--claude-code-no-extension) and [`standalone.mcp.example.json`](../standalone.mcp.example.json).

```bash
npm run build:mcp
set VTEX_MCP_WORKSPACE_ROOT=C:\path\to\your-project
npm run start:mcp
```
