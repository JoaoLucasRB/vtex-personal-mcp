
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
cd c:\Projetos\vtex-mcp\extension
npm install
npm run compile
```

In Cursor:

1. Open **Extensions: Install from Location…**
2. Select:

   ```text
   c:\Projetos\vtex-mcp\extension
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

The standalone mode uses the **same MCP binary**, but credentials are loaded from a file or environment variables.

This mode is useful for:

- Claude Code
- OpenAI Codex
- VS Code + GitHub Copilot
- Cursor without the extension
- Claude Desktop
- Other stdio-compatible MCP clients

---

## 1. Prerequisites

- **Node.js 20+** available on `PATH`

  ```bash
  node -v
  ```

- A clone of this repository, or at least the `extension/` directory built once.

---

## 2. Build the MCP Server

Run the following once:

```bash
cd c:\Projetos\vtex-mcp\extension
npm install
npm run build:mcp
```

The resulting entry point is:

```text
c:\Projetos\vtex-mcp\extension\out-mcp\index.js
```

> [!TIP]
> Always use an **absolute path** to `out-mcp/index.js` in client configurations.

### Smoke Test

This starts the server over stdio and is useful when testing with an MCP client attached:

```bash
cd extension
set VTEX_MCP_WORKSPACE_ROOT=C:\path\to\your-faststore-or-io-project
npm run start:mcp
```

---

# 3. Configure `accounts.json`

Standalone mode does **not** use the Cursor **Add Account** UI.

Instead, create a credentials file manually.

## 3.1 Create the Directory and File

### Windows — PowerShell

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.vtex-mcp"
Copy-Item c:\Projetos\vtex-mcp\accounts.example.json "$env:USERPROFILE\.vtex-mcp\accounts.json"
notepad "$env:USERPROFILE\.vtex-mcp\accounts.json"
```

### macOS / Linux

```bash
mkdir -p ~/.vtex-mcp
cp /path/to/vtex-mcp/accounts.example.json ~/.vtex-mcp/accounts.json
${EDITOR:-nano} ~/.vtex-mcp/accounts.json
```

### File Location

Default:

```text
~/.vtex-mcp/accounts.json
```

Override the location with:

```text
VTEX_MCP_ACCOUNTS_FILE=/absolute/path/to/accounts.json
```

---

## 3.2 Get an AppKey / AppToken

For each VTEX account you want to use:

1. Open the VTEX Admin account:

   ```text
   https://{account}.myvtex.com/admin
   ```

2. Go to **Account Settings → Account management → Account → Generate new app key**.
3. If your organization uses a different API key management page, use the equivalent location.
4. Copy the **App Key** and **App Token**.
5. Store the token securely — it is shown only once.

> [!IMPORTANT]
> The AppKey must have policies covering the APIs you intend to use, such as Catalog, OMS, Pricing, and others.

---

## 3.3 Edit `accounts.json`

The structure is based on [`accounts.example.json`](accounts.example.json):

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

### Configuration Reference

| Field | Required | Description |
|---|:---:|---|
| `environment` | No | Defaults to `vtexcommercestable`. Can be overridden with `VTEX_ENVIRONMENT`. |
| `accounts` | **Yes** | Non-empty object containing the configured VTEX accounts. |
| `accounts.<name>.appKey` | **Yes** | AppKey. Also accepts `app_key`. |
| `accounts.<name>.appToken` | **Yes** | AppToken. Also accepts `app_token`. |

> [!NOTE]
> The account name must match the project account discovered by the MCP from `api.storeId`, IO `vendor`, or `.vtex-mcp.json` `account`. Matching is case-insensitive.

> [!CAUTION]
> **Never commit real AppTokens.**
>
> Keep `~/.vtex-mcp/accounts.json` outside the repository, use a gitignored location, or provide credentials through environment variables.

---

## 3.4 Credential Load Order

The MCP uses the **first source that succeeds**:

1. `VTEX_ACCOUNTS_JSON` — complete JSON configuration.
2. Accounts file:
   - `VTEX_MCP_ACCOUNTS_FILE`, or
   - `~/.vtex-mcp/accounts.json`
3. Legacy environment variables:
   - `VTEX_ACCOUNT`
   - `VTEX_APP_KEY`
   - `VTEX_APP_TOKEN`
   - Optional: `VTEX_ENVIRONMENT`

---

## 3.5 Point the MCP at the Commerce Project

Account resolution is **project-only**. There is no `account=` tool argument.

Set either:

```text
VTEX_MCP_WORKSPACE_ROOT=<absolute-path-to-your-commerce-project>
```

or start the MCP with the commerce project as its process **current working directory**. Some MCP clients do this automatically when the project is opened.

### Project Account Discovery

The MCP searches for the account in this order:

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

> [!NOTE]
> If the discovered account does not have an entry in `accounts.json`, the tools **skip the account** while the MCP process continues running.

---

# 4. Shared stdio Server Configuration

Every supported client ultimately runs:

```text
node <absolute-path-to>/extension/out-mcp/index.js
```

Optionally provide the workspace:

```text
VTEX_MCP_WORKSPACE_ROOT=<absolute-path-to-your-commerce-project>
```

## Generic Configuration

The same structure is also available in [`standalone.mcp.example.json`](standalone.mcp.example.json):

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

Replace both paths with your local paths.

> [!TIP]
> On Windows, prefer forward slashes or escaped backslashes in JSON configuration files.

---

# 5. Install per MCP Client

Complete **§2–§3** before configuring a client.

---

## Cursor — Manual MCP

Use this when running the standalone server **without the Cursor extension**.

1. Build the server and configure `accounts.json`.
2. Open or create:

   ```text
   ~/.cursor/mcp.json
   ```

   On Windows:

   ```text
   %USERPROFILE%\.cursor\mcp.json
   ```

3. Add the `mcpServers.vtex` block from §4 or `standalone.mcp.example.json`.
4. Restart Cursor or reload MCP servers.
5. Open your FastStore / IO project, or set `VTEX_MCP_WORKSPACE_ROOT`.

> [!WARNING]
> Do not enable both the Cursor extension registration and a manually configured server for the same setup if you want a single MCP instance. Choose **extension** or **manual `mcp.json`**.

### Project-scoped Configuration

You can also create:

```text
.cursor/mcp.json
```

inside the workspace using the same `mcpServers` structure.

---

## Claude Code

### CLI — Recommended

```bash
claude mcp add --transport stdio --scope user \
  --env VTEX_MCP_WORKSPACE_ROOT=C:/path/to/your-faststore-or-io-project \
  vtex -- node C:/Projetos/vtex-mcp/extension/out-mcp/index.js
```

### Scopes

| Scope | Storage | Shared with team? |
|---|---|:---:|
| `--scope user` | `~/.claude.json` | No — available across your projects |
| `--scope local` *(default)* | `~/.claude.json` | No — scoped to the project path |
| `--scope project` | Project `.mcp.json` | Yes — commit carefully |

> [!CAUTION]
> Do not put secrets in environment variables inside a shared project configuration.

### Project Configuration

Create `.mcp.json` at the root of the commerce project or a wrapper repository:

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

Verify the server:

```bash
claude mcp list
```

> [!NOTE]
> Claude Code may ask you to approve project servers the first time you run `claude` in the project directory.

---

## OpenAI Codex

Codex uses **TOML**, not JSON.

Edit:

```text
~/.codex/config.toml
```

or use a trusted project configuration:

```text
.codex/config.toml
```

```toml
[mcp_servers.vtex]
command = "node"
args = ["C:/Projetos/vtex-mcp/extension/out-mcp/index.js"]

[mcp_servers.vtex.env]
VTEX_MCP_WORKSPACE_ROOT = "C:/path/to/your-faststore-or-io-project"
```

### CLI

```bash
codex mcp add vtex \
  --env VTEX_MCP_WORKSPACE_ROOT=C:/path/to/your-faststore-or-io-project \
  -- node C:/Projetos/vtex-mcp/extension/out-mcp/index.js

codex mcp list
```

### Codex TUI / ChatGPT Desktop Codex UI

Use:

**Settings → MCP servers**

or:

```text
/mcp
```

Restart the Codex host after configuration changes.

---

## VS Code + GitHub Copilot

1. Open the Command Palette.
2. Select **MCP: Open User Configuration** for a global configuration, or create:

   ```text
   .vscode/mcp.json
   ```

3. VS Code uses a `servers` key instead of `mcpServers`:

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

4. Run **MCP: List Servers**.
5. Start or restart `vtex`.
6. Open Agent / Copilot Chat with tools enabled.
7. Confirm that the VTEX tools are available.

> [!NOTE]
> Portable Copilot / Agent Host layouts may also read workspace `.mcp.json` or `~/.copilot/mcp-config.json`. If the selected configuration file supports the same schema, use the same stdio `command`, `args`, and `env` values.

---

## Claude Desktop

Optional configuration:

**Settings → Developer → Edit Config**

Configuration file:

### macOS

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows

```text
%APPDATA%\Claude\claude_desktop_config.json
```

Use the `mcpServers` JSON block from §4.

> [!IMPORTANT]
> Fully quit and restart Claude Desktop after changing the configuration.

---

# 6. Quick Checklist

Use this checklist to verify a standalone installation:

- [ ] Run `npm run build:mcp` inside `extension/`
- [ ] Create `~/.vtex-mcp/accounts.json`
- [ ] Add the AppKey / AppToken for the project account
- [ ] Configure the client to run `node` against the absolute `out-mcp/index.js` path
- [ ] Set `VTEX_MCP_WORKSPACE_ROOT` or use the commerce project as the process `cwd`
- [ ] Restart / reload the MCP host
- [ ] Verify the VTEX tools are available, for example `get_vtex_context`

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

