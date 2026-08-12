#!/usr/bin/env node
/**
 * Interactive standalone MCP setup (not for Cursor extension users).
 * Usage (prefer commerce project as cwd for auto-detect):
 *   cd /path/to/faststore-or-io
 *   npm --prefix /path/to/vtex-mcp/extension run setup:mcp
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(EXTENSION_ROOT, "..");
const MCP_ENTRY = path.join(EXTENSION_ROOT, "out-mcp", "index.js");

const CLIENTS = [
  {
    id: "claude",
    label: "Claude Code",
  },
  {
    id: "codex",
    label: "OpenAI Codex",
  },
  {
    id: "vscode",
    label: "VS Code + GitHub Copilot",
  },
  {
    id: "cursor",
    label: "Cursor (manual mcp.json — skip if using the Cursor extension)",
  },
];

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function directoriesUp(start) {
  const result = [];
  let current = path.resolve(start);
  while (true) {
    result.push(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return result;
}

function isInsideMcpRepo(dir) {
  const resolved = path.resolve(dir);
  const roots = [EXTENSION_ROOT, REPO_ROOT];
  return roots.some(
    (root) => resolved === root || resolved.startsWith(root + path.sep)
  );
}

function readVtexMcpAccount(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (typeof data.account === "string" && data.account.trim()) {
      return data.account.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function readManifestVendor(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (typeof data.vendor === "string" && data.vendor.trim()) {
      return data.vendor.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function readFastStoreStoreId(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    const match = text.match(/storeId\s*:\s*['"]([A-Za-z0-9_-]+)['"]/);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

function discoverProjectAccount(start) {
  const dirs = directoriesUp(start);

  for (const directory of dirs) {
    if (isInsideMcpRepo(directory)) {
      continue;
    }
    const mcpFile = path.join(directory, ".vtex-mcp.json");
    if (fs.existsSync(mcpFile) && fs.statSync(mcpFile).isFile()) {
      const account = readVtexMcpAccount(mcpFile);
      if (account) {
        return {
          account,
          source: ".vtex-mcp.json",
          workspaceRoot: directory,
        };
      }
    }
  }

  for (const directory of dirs) {
    if (isInsideMcpRepo(directory)) {
      continue;
    }
    for (const name of ["discovery.config.js", "discovery.config.ts"]) {
      const discovery = path.join(directory, name);
      if (fs.existsSync(discovery) && fs.statSync(discovery).isFile()) {
        const storeId = readFastStoreStoreId(discovery);
        if (storeId) {
          return {
            account: storeId,
            source: `${name}:api.storeId`,
            workspaceRoot: directory,
          };
        }
      }
    }
  }

  for (const directory of dirs) {
    if (isInsideMcpRepo(directory)) {
      continue;
    }
    const manifest = path.join(directory, "manifest.json");
    if (fs.existsSync(manifest) && fs.statSync(manifest).isFile()) {
      const vendor = readManifestVendor(manifest);
      if (vendor) {
        return {
          account: vendor,
          source: "manifest.json:vendor",
          workspaceRoot: directory,
        };
      }
    }
  }

  return null;
}

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { stdio: "ignore" });
  return result.status === 0;
}

function ensureBuilt() {
  if (fs.existsSync(MCP_ENTRY)) {
    console.log(`MCP binary found: ${MCP_ENTRY}`);
    return;
  }
  console.log("Building MCP server (npm run build:mcp)…");
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build:mcp"],
    { cwd: EXTENSION_ROOT, stdio: "inherit", shell: true }
  );
  if (result.status !== 0 || !fs.existsSync(MCP_ENTRY)) {
    die("Failed to build out-mcp/index.js. Run npm install && npm run build:mcp in extension/.");
  }
}

function accountsPath() {
  const override = (process.env.VTEX_MCP_ACCOUNTS_FILE || "").trim();
  if (override) {
    return path.resolve(override.replace(/^~(?=$|[\\/])/, os.homedir()));
  }
  return path.join(os.homedir(), ".vtex-mcp", "accounts.json");
}

function loadAccountsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { environment: "vtexcommercestable", accounts: {} };
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { environment: "vtexcommercestable", accounts: {} };
    }
    return {
      environment:
        typeof data.environment === "string" && data.environment.trim()
          ? data.environment.trim()
          : "vtexcommercestable",
      accounts:
        data.accounts && typeof data.accounts === "object" && !Array.isArray(data.accounts)
          ? { ...data.accounts }
          : {},
    };
  } catch (error) {
    die(
      `Could not parse ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function writeAccountsFile(filePath, store) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function toPosixPath(p) {
  return p.replace(/\\/g, "/");
}

function stdioServerBlock(workspaceRoot) {
  return {
    command: "node",
    args: [toPosixPath(MCP_ENTRY)],
    env: {
      VTEX_MCP_WORKSPACE_ROOT: toPosixPath(workspaceRoot),
    },
  };
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    die(
      `Invalid JSON in ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function confirmOverwrite(rl, targetLabel) {
  const answer = (
    await rl.question(`Overwrite existing "vtex" entry in ${targetLabel}? [y/N] `)
  )
    .trim()
    .toLowerCase();
  return answer === "y" || answer === "yes";
}

async function mergeMcpServersJson(rl, filePath, key, workspaceRoot, label) {
  const data = readJsonFile(filePath, {});
  if (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key])) {
    data[key] = {};
  }
  if (data[key].vtex) {
    const ok = await confirmOverwrite(rl, label);
    if (!ok) {
      console.log(`Skipped ${label}.`);
      return;
    }
  }
  data[key].vtex = stdioServerBlock(workspaceRoot);
  writeJsonFile(filePath, data);
  console.log(`Updated ${filePath}`);
}

async function mergeVscodeMcp(rl, workspaceRoot) {
  const filePath = path.join(workspaceRoot, ".vscode", "mcp.json");
  const data = readJsonFile(filePath, {});
  if (!data.servers || typeof data.servers !== "object" || Array.isArray(data.servers)) {
    data.servers = {};
  }
  if (data.servers.vtex) {
    const ok = await confirmOverwrite(rl, filePath);
    if (!ok) {
      console.log(`Skipped ${filePath}.`);
      return;
    }
  }
  const block = stdioServerBlock(workspaceRoot);
  data.servers.vtex = {
    type: "stdio",
    command: block.command,
    args: block.args,
    env: block.env,
  };
  writeJsonFile(filePath, data);
  console.log(`Updated ${filePath}`);
}

function removeTomlTable(content, tableHeader) {
  const lines = content.split(/\r?\n/);
  const header = tableHeader.trim();
  const out = [];
  let skipping = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      if (trimmed === header || trimmed.startsWith(header.slice(0, -1) + ".")) {
        skipping = true;
        continue;
      }
      skipping = false;
    }
    if (!skipping) {
      out.push(line);
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

async function mergeCodexToml(rl, workspaceRoot) {
  const filePath = path.join(os.homedir(), ".codex", "config.toml");
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (/\[mcp_servers\.vtex\]/.test(content)) {
    const ok = await confirmOverwrite(rl, filePath);
    if (!ok) {
      console.log(`Skipped ${filePath}.`);
      return;
    }
    content = removeTomlTable(content, "[mcp_servers.vtex]");
  }

  const entry = toPosixPath(MCP_ENTRY);
  const root = toPosixPath(workspaceRoot);
  const block = [
    "",
    "[mcp_servers.vtex]",
    'command = "node"',
    `args = ["${entry}"]`,
    "",
    "[mcp_servers.vtex.env]",
    `VTEX_MCP_WORKSPACE_ROOT = "${root}"`,
    "",
  ].join("\n");

  const next = (content.trimEnd() + "\n" + block).trimStart() + "\n";
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next, "utf8");
  console.log(`Updated ${filePath}`);
}

async function configureClaude(rl, workspaceRoot) {
  if (commandExists("claude")) {
    const args = [
      "mcp",
      "add",
      "--transport",
      "stdio",
      "--scope",
      "user",
      "--env",
      `VTEX_MCP_WORKSPACE_ROOT=${toPosixPath(workspaceRoot)}`,
      "vtex",
      "--",
      "node",
      toPosixPath(MCP_ENTRY),
    ];
    console.log("Running: claude " + args.join(" "));
    const result = spawnSync("claude", args, { stdio: "inherit", shell: true });
    if (result.status === 0) {
      return;
    }
    console.warn("claude mcp add failed; falling back to ~/.claude.json merge.");
  }

  const filePath = path.join(os.homedir(), ".claude.json");
  await mergeMcpServersJson(
    rl,
    filePath,
    "mcpServers",
    workspaceRoot,
    filePath
  );
}

async function configureCodex(rl, workspaceRoot) {
  if (commandExists("codex")) {
    const args = [
      "mcp",
      "add",
      "vtex",
      "--env",
      `VTEX_MCP_WORKSPACE_ROOT=${toPosixPath(workspaceRoot)}`,
      "--",
      "node",
      toPosixPath(MCP_ENTRY),
    ];
    console.log("Running: codex " + args.join(" "));
    const result = spawnSync("codex", args, { stdio: "inherit", shell: true });
    if (result.status === 0) {
      return;
    }
    console.warn("codex mcp add failed; falling back to ~/.codex/config.toml merge.");
  }
  await mergeCodexToml(rl, workspaceRoot);
}

async function resolveWorkspace(rl) {
  const fromEnv = (process.env.VTEX_MCP_WORKSPACE_ROOT || "").trim();
  if (fromEnv) {
    const resolved = path.resolve(fromEnv);
    const discovered = discoverProjectAccount(resolved);
    console.log(`Using VTEX_MCP_WORKSPACE_ROOT from env: ${resolved}`);
    return {
      workspaceRoot: resolved,
      account: discovered?.account ?? "",
      source: discovered?.source ?? "env",
    };
  }

  const discovered = discoverProjectAccount(process.cwd());
  if (discovered) {
    console.log(
      `Detected commerce project: ${discovered.workspaceRoot} (${discovered.source} → ${discovered.account})`
    );
    return discovered;
  }

  console.log(
    "Could not auto-detect a FastStore/IO project from the current directory."
  );
  console.log(
    "Tip: run from the store folder:\n  npm --prefix <path-to-vtex-mcp/extension> run setup:mcp\n"
  );
  while (true) {
    const raw = (
      await rl.question("Absolute path to your FastStore/IO project: ")
    ).trim();
    if (!raw) {
      console.log("Path is required.");
      continue;
    }
    const resolved = path.resolve(raw.replace(/^~(?=$|[\\/])/, os.homedir()));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      console.log("Directory not found. Try again.");
      continue;
    }
    if (isInsideMcpRepo(resolved)) {
      console.log("That path is the vtex-mcp repo, not a commerce project. Try again.");
      continue;
    }
    const nested = discoverProjectAccount(resolved);
    return {
      workspaceRoot: nested?.workspaceRoot ?? resolved,
      account: nested?.account ?? "",
      source: nested?.source ?? "manual",
    };
  }
}

async function promptCredentials(rl, defaults) {
  const accountDefault = defaults.account || "";
  const accountAns = (
    await rl.question(
      `VTEX account name${accountDefault ? ` [${accountDefault}]` : ""}: `
    )
  ).trim();
  const account = accountAns || accountDefault;
  if (!account) {
    die("Account name is required.");
  }

  const appKey = (await rl.question("AppKey: ")).trim();
  if (!appKey) {
    die("AppKey is required.");
  }

  const appToken = (await rl.question("AppToken: ")).trim();
  if (!appToken) {
    die("AppToken is required.");
  }

  const envDefault = defaults.environment || "vtexcommercestable";
  const envAns = (
    await rl.question(`Environment [${envDefault}]: `)
  ).trim();
  const environment = envAns || envDefault;

  return { account, appKey, appToken, environment };
}

async function promptClients(rl) {
  console.log("\nWhich MCP clients should be configured?");
  console.log(
    "(Cursor extension users: skip Cursor here — use Option A / VTEX: Add Account instead.)\n"
  );
  CLIENTS.forEach((client, index) => {
    console.log(`  ${index + 1}) ${client.label}`);
  });
  const raw = (
    await rl.question(
      "Enter numbers separated by commas (e.g. 1,2,3), or 'all': "
    )
  )
    .trim()
    .toLowerCase();

  if (!raw) {
    return [];
  }
  if (raw === "all") {
    return CLIENTS.map((c) => c.id);
  }

  const ids = new Set();
  for (const part of raw.split(/[,\s]+/)) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 1 || n > CLIENTS.length) {
      die(`Invalid selection: ${part}`);
    }
    ids.add(CLIENTS[n - 1].id);
  }
  return [...ids];
}

async function main() {
  if (!process.stdin.isTTY) {
    die(
      "setup:mcp requires an interactive terminal.\n" +
        "Run from a commerce project:\n" +
        "  npm --prefix <path-to-vtex-mcp/extension> run setup:mcp"
    );
  }

  console.log("VTEX MCP standalone setup");
  console.log("=========================");
  console.log(
    "For Cursor with the extension installed, use VTEX: Add Account instead — no need for this wizard.\n"
  );

  ensureBuilt();

  const rl = readline.createInterface({ input, output });
  try {
    const project = await resolveWorkspace(rl);
    const existingPath = accountsPath();
    const existing = loadAccountsFile(existingPath);

    const creds = await promptCredentials(rl, {
      account: project.account,
      environment: existing.environment,
    });

    if (existing.accounts[creds.account]) {
      const ok = (
        await rl.question(
          `Account "${creds.account}" already exists in ${existingPath}. Overwrite? [y/N] `
        )
      )
        .trim()
        .toLowerCase();
      if (ok !== "y" && ok !== "yes") {
        die("Aborted without changing accounts.json.", 0);
      }
    }

    existing.environment = creds.environment;
    existing.accounts[creds.account] = {
      appKey: creds.appKey,
      appToken: creds.appToken,
    };
    writeAccountsFile(existingPath, existing);
    console.log(`Wrote credentials to ${existingPath}`);

    const selected = await promptClients(rl);
    if (selected.length === 0) {
      console.log(
        "\nNo clients selected. accounts.json is ready; configure clients manually if needed."
      );
    } else {
      for (const id of selected) {
        console.log("");
        if (id === "claude") {
          await configureClaude(rl, project.workspaceRoot);
        } else if (id === "codex") {
          await configureCodex(rl, project.workspaceRoot);
        } else if (id === "vscode") {
          await mergeVscodeMcp(rl, project.workspaceRoot);
        } else if (id === "cursor") {
          const cursorPath = path.join(os.homedir(), ".cursor", "mcp.json");
          await mergeMcpServersJson(
            rl,
            cursorPath,
            "mcpServers",
            project.workspaceRoot,
            cursorPath
          );
        }
      }
    }

    console.log("\nDone.");
    console.log(`  MCP entry:     ${MCP_ENTRY}`);
    console.log(`  Workspace:     ${project.workspaceRoot}`);
    console.log(`  Accounts file: ${existingPath}`);
    console.log(
      "\nNext: restart your MCP client(s) and verify tools (e.g. get_vtex_context)."
    );
    if (selected.includes("claude")) {
      console.log("  Claude Code: claude mcp list");
    }
    if (selected.includes("codex")) {
      console.log("  Codex: codex mcp list");
    }
    if (selected.includes("vscode")) {
      console.log("  VS Code: MCP: List Servers → start/restart vtex");
    }
    if (selected.includes("cursor")) {
      console.log("  Cursor: reload MCP / restart Cursor");
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  die(error instanceof Error ? error.message : String(error));
});
