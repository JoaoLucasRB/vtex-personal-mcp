
# VTEX GraphQL-REST MCP

> ## IMPORTANT
> **Unofficial Project — Not Affiliated with VTEX**
> 
> This project is an **independent, community-developed tool** and is **not officially created, maintained, endorsed, sponsored, or supported by VTEX**.
> 
> **VTEX** is a trademark of VTEX, Inc. This project uses publicly available VTEX APIs and documentation to provide development and integration capabilities, but there is **no official relationship or affiliation between this project and VTEX, Inc.**
> 
> Any references to VTEX, its products, APIs, services, or trademarks are made solely for compatibility and descriptive purposes.
> 
> For official VTEX documentation, support, products, and services, please refer to the official VTEX resources.

> **VTEX GraphQL-REST MCP** is a Personal Cursor extension **and** standalone TypeScript MCP server for VTEX APIs.
>
> Use it directly inside **Cursor**, or run the same `out-mcp/index.js` from **Claude Code**, **OpenAI Codex**, **VS Code + GitHub Copilot**, **Claude Desktop**, or any other stdio MCP client.

---

## 📦 Project Structure

```text
vtex-mcp/
├── extension/
│   ├── src/                   # Cursor extension + account UI
│   ├── mcp/                   # MCP stdio server source
│   ├── scripts/
│   │   └── setup-mcp.mjs      # Standalone interactive setup
│   └── out-mcp/
│       └── index.js           # Bundled MCP entry point
├── accounts.example.json
└── standalone.mcp.example.json
```

---

# Option A — Cursor Extension

The Cursor extension stores credentials in **Cursor SecretStorage**, so you do **not** need an `accounts.json` file.

## Installation

```bash
cd C:\path\to\vtex-mcp\extension
npm install
npm run compile
```

In Cursor:

1. Open **Extensions: Install from Location…**
2. Select:

   ```text
   C:\path\to\vtex-mcp\extension
   ```

3. Alternatively, install the packaged `.vsix`.

## Account Setup

After installing the extension:

1. Open a **FastStore** or **IO** project folder.
2. Run **VTEX: Add Account** and configure the project's account with its **AppKey / AppToken**.
3. The MCP registers as `extension-vtex` only when the currently open project has matching credentials.
4. Run **VTEX: Re-register MCP** after switching folders or adding the matching account.

> [!IMPORTANT]
> If the project account is missing or has no credentials, the MCP remains **unregistered** and does nothing.

## Settings

| Setting | Default | Description |
|---|---|---|
| `vtexMcp.environment` | `vtexcommercestable` | VTEX API environment |
| `vtexMcp.autoRegister` | `true` | Automatically register the MCP on activation, account changes, or folder changes |
| `vtexMcp.faststoreGraphqlUrl` | `http://localhost:3000/api/graphql` | Local FastStore BFF used by `graphql_faststore_*` tools |

---

# Option B — Standalone MCP Server

The standalone mode uses the **same MCP binary**, with credentials in `~/.vtex-mcp/accounts.json` (or env). Use this for:

- Claude Code
- OpenAI Codex
- VS Code + GitHub Copilot
- Cursor **without** the extension
- Claude Desktop
- Other stdio MCP clients

> [!IMPORTANT]
> If you use **Option A (Cursor extension)**, you do **not** need `setup:mcp`. Use **VTEX: Add Account** instead. Running both can register duplicate servers.

---

## 1. Prerequisites

- **Node.js 20+** on `PATH` (`node -v`)
- A clone of this repository (at least `extension/`)
- A VTEX **AppKey / AppToken** for the store account you will open
- Your **FastStore** or **IO** commerce project on disk

---

## 2. Install dependencies (once)

```bash
cd C:\path\to\vtex-mcp\extension
npm install
```

The setup wizard builds `out-mcp/index.js` if it is missing.

---

## 3. Run the setup wizard (recommended)

The wizard prompts for credentials, writes/merges `~/.vtex-mcp/accounts.json`, detects (or asks for) the commerce project path, and can configure selected MCP clients.

### Preferred — run from the commerce project (auto-detect)

With your FastStore/IO project as the current directory, `VTEX_MCP_WORKSPACE_ROOT` and the account name are **usually** detected automatically:

```bash
cd C:\path\to\your-faststore-or-io-project
npm --prefix C:\path\to\vtex-mcp\extension run setup:mcp
```

### Alternate — run from the MCP repo

```bash
cd C:\path\to\vtex-mcp\extension
npm run setup:mcp
```

If detection fails, enter the absolute path to your FastStore/IO project when prompted.

### What the wizard does

1. Builds `out-mcp/index.js` if needed
2. Resolves the commerce workspace (`VTEX_MCP_WORKSPACE_ROOT` env → auto-detect from cwd → prompt)
3. Prompts for account, AppKey, AppToken, and environment
4. Writes/merges `~/.vtex-mcp/accounts.json`
5. Optionally configures clients you select:
   - Claude Code
   - OpenAI Codex
   - VS Code + GitHub Copilot
   - Cursor (manual `mcp.json` only — skip if using the extension)

---

## 4. Restart and verify

1. Restart or reload the MCP host for each client you configured
2. Confirm VTEX tools appear (for example `get_vtex_context`)

Useful checks:

```bash
claude mcp list
codex mcp list
```

VS Code: **MCP: List Servers** → start/restart `vtex`.

---

## 5. Optional smoke test

With a client attached (stdio):

```bash
cd C:\path\to\vtex-mcp\extension
set VTEX_MCP_WORKSPACE_ROOT=C:\path\to\your-faststore-or-io-project
npm run start:mcp
```

---

## 6. Quick checklist (wizard path)

- [ ] `npm install` in `extension/`
- [ ] `npm run setup:mcp` (preferably from the commerce project cwd)
- [ ] Restart / reload the MCP client(s)
- [ ] Verify tools such as `get_vtex_context`

---

# Manual configuration (advanced / fallback)

Use this if you prefer not to run the wizard, or need to hand-edit client configs. Complete a build first:

```bash
cd C:\path\to\vtex-mcp\extension
npm install
npm run build:mcp
```

Entry point (use an **absolute** path in client configs):

```text
C:\path\to\vtex-mcp\extension\out-mcp\index.js
```

---

## Manual — `accounts.json`

### Create the file

**Windows — PowerShell:**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.vtex-mcp"
Copy-Item C:\path\to\vtex-mcp\accounts.example.json "$env:USERPROFILE\.vtex-mcp\accounts.json"
notepad "$env:USERPROFILE\.vtex-mcp\accounts.json"
```

**macOS / Linux:**

```bash
mkdir -p ~/.vtex-mcp
cp /path/to/vtex-mcp/accounts.example.json ~/.vtex-mcp/accounts.json
${EDITOR:-nano} ~/.vtex-mcp/accounts.json
```

Default path: `~/.vtex-mcp/accounts.json`  
Override: `VTEX_MCP_ACCOUNTS_FILE=/absolute/path/to/accounts.json`

### Get an AppKey / AppToken

1. Open `https://{account}.myvtex.com/admin`
2. **Account Settings → Account management → Account → Generate new app key** (or your org's equivalent)
3. Copy App Key and App Token (token is shown once)

### File shape

See [`accounts.example.json`](accounts.example.json):

```json
{
  "environment": "vtexcommercestable",
  "accounts": {
    "{account}": {
      "appKey": "vtexappkey-{account}-XXXXXXXX",
      "appToken": "paste-the-secret-token-here"
    }
  }
}
```

| Field | Required | Description |
|---|:---:|---|
| `environment` | No | Defaults to `vtexcommercestable`. Override with `VTEX_ENVIRONMENT`. |
| `accounts` | **Yes** | Non-empty object of VTEX accounts. |
| `accounts.<name>.appKey` | **Yes** | Also accepts `app_key`. |
| `accounts.<name>.appToken` | **Yes** | Also accepts `app_token`. |

Account name must match the discovered project account (`api.storeId`, IO `vendor`, or `.vtex-mcp.json`). Matching is case-insensitive.

> [!CAUTION]
> Never commit real AppTokens.

### Credential load order

1. `VTEX_ACCOUNTS_JSON`
2. `VTEX_MCP_ACCOUNTS_FILE` or `~/.vtex-mcp/accounts.json`
3. Legacy: `VTEX_ACCOUNT` + `VTEX_APP_KEY` + `VTEX_APP_TOKEN` (+ optional `VTEX_ENVIRONMENT`)

### Point at the commerce project

Set `VTEX_MCP_WORKSPACE_ROOT=<absolute-path-to-commerce-project>` or run the MCP with that folder as cwd.

Discovery order: `.vtex-mcp.json` → FastStore `discovery.config.*` `api.storeId` → IO `manifest.json` `vendor`.

If the discovered account has no credentials, tools skip while the process keeps running.

---

## Manual — shared stdio block

Every client ultimately runs:

```text
node <absolute-path-to>/extension/out-mcp/index.js
```

with optional:

```text
VTEX_MCP_WORKSPACE_ROOT=<absolute-path-to-your-commerce-project>
```

See [`standalone.mcp.example.json`](standalone.mcp.example.json):

```json
{
  "mcpServers": {
    "vtex": {
      "command": "node",
      "args": [
        "C:/Projetos/vtex-mcp/extension/out-mcp/index.js"
      ],
      "env": {
        "VTEX_MCP_WORKSPACE_ROOT": "C:/path/to/your-faststore-or-io-project"
      }
    }
  }
}
```

---

## Manual — Cursor (no extension)

1. Edit `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`)
2. Merge the `mcpServers.vtex` block above
3. Restart Cursor / reload MCP
4. Open the FastStore/IO project or set `VTEX_MCP_WORKSPACE_ROOT`

> [!WARNING]
> Do not use both the Cursor extension and a manual `mcp.json` entry for the same setup if you want a single instance.

Project-scoped alternative: `.cursor/mcp.json` in the workspace.

---

## Manual — Claude Code

**CLI (recommended):**

```bash
claude mcp add --transport stdio --scope user \
  --env VTEX_MCP_WORKSPACE_ROOT=C:/path/to/your-faststore-or-io-project \
  vtex -- node C:/Projetos/vtex-mcp/extension/out-mcp/index.js
```

| Scope | Storage | Shared? |
|---|---|:---:|
| `--scope user` | `~/.claude.json` | No |
| `--scope local` (default) | `~/.claude.json` (per project path) | No |
| `--scope project` | project `.mcp.json` | Yes — no secrets in shared env |

Project `.mcp.json` uses the same `mcpServers` shape as the shared stdio block. Then: `claude mcp list`.

---

## Manual — OpenAI Codex

Edit `~/.codex/config.toml` (or trusted project `.codex/config.toml`):

```toml
[mcp_servers.vtex]
command = "node"
args = ["C:/Projetos/vtex-mcp/extension/out-mcp/index.js"]

[mcp_servers.vtex.env]
VTEX_MCP_WORKSPACE_ROOT = "C:/path/to/your-faststore-or-io-project"
```

Or:

```bash
codex mcp add vtex \
  --env VTEX_MCP_WORKSPACE_ROOT=C:/path/to/your-faststore-or-io-project \
  -- node C:/Projetos/vtex-mcp/extension/out-mcp/index.js
codex mcp list
```

---

## Manual — VS Code + GitHub Copilot

Command Palette → **MCP: Open User Configuration**, or create `.vscode/mcp.json` (note `servers`, not `mcpServers`):

```json
{
  "servers": {
    "vtex": {
      "type": "stdio",
      "command": "node",
      "args": [
        "C:/Projetos/vtex-mcp/extension/out-mcp/index.js"
      ],
      "env": {
        "VTEX_MCP_WORKSPACE_ROOT": "C:/path/to/your-faststore-or-io-project"
      }
    }
  }
}
```

Then **MCP: List Servers** → start/restart `vtex`.

---

## Manual — Claude Desktop

**Settings → Developer → Edit Config**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Use the `mcpServers` JSON block from the shared stdio section. Fully quit and restart Claude Desktop.

---


# Account Resolution

Account resolution works the same way for both installation options.

> **Open project only.**
>
> There is no `account=` tool argument. Toolbelt login is display-only.

## Project Discovery Order

The MCP checks the following locations, in order:

1. `.vtex-mcp.json`

   ```json
   {
     "account": "..."
   }
   ```

2. FastStore `discovery.config.js` / `.ts`

   ```text
   api.storeId
   ```

3. IO `manifest.json`

   ```text
   vendor
   ```

---

# Tools & API Coverage

## Account

- `get_vtex_context`
- `list_vtex_accounts`

## GraphQL

| Group | Tools | Target |
|---|---|---|
| **Search** | `graphql_search_list`, `graphql_search_query` | `vtex.search-graphql` on the IO gateway |
| **IO** | `graphql_io_list`, `graphql_io_query` | `vtex.store-graphql` + `provider` for other apps |
| **FastStore** | `graphql_faststore_list`, `graphql_faststore_query` | Local `.faststore` BFF |

## REST

REST tools follow the hierarchical:

```text
domain_resource_action
```

### Catalog

Catalog REST is intended for **GraphQL gaps only**:

- Category create / update
- Product create / update
- SKU create / update
- Brand administration
- Specifications
- Seller Portal product creation

> **Reads use GraphQL.**

### Additional REST APIs

The MCP also covers:

- Orders
- Pricing
- Logistics
- Master Data v2
- Promotions
- Payments
- Gift Cards
- B2B
- Subscriptions
- Marketplace
- Customer Credit
- License
- Profile
- Reviews
- CMS
- Audience
- Pick and Pack
- Delivery Promise
- Shipping Network

---

## 🔐 Security Reminder

Never commit credentials to the repository.

Keep AppTokens in:

- `~/.vtex-mcp/accounts.json`
- A secure, gitignored location
- Environment variables such as `VTEX_ACCOUNTS_JSON`

Treat AppTokens as secrets and grant AppKeys only the policies required by the APIs you need.

## License

MIT — see [LICENSE](LICENSE).

