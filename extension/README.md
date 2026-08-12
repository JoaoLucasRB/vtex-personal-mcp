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

## Standalone (no extension)

Use the interactive wizard (preferred for Claude Code, Codex, VS Code Copilot, etc.). Cursor extension users should **not** need this — use **VTEX: Add Account** instead.

```bash
cd C:\path\to\your-faststore-or-io-project
npm --prefix C:\Projetos\vtex-mcp\extension run setup:mcp
```

Details: root [README Option B](../README.md#option-b--standalone-mcp-server).
