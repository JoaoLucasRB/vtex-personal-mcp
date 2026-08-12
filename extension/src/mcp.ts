import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import * as vscode from "vscode";

import { buildProjectAccountsJson } from "./accounts";
import { discoverProjectAccount } from "./projectAccount";

export const MCP_SERVER_NAME = "vtex";

const ENABLED_KEY = "vtexMcp.mcpEnabled";

type CursorMcpApi = {
  registerServer: (config: {
    name: string;
    server: {
      command: string;
      args: string[];
      env: Record<string, string>;
    };
  }) => void;
  unregisterServer: (serverName: string) => void;
};

function getCursorMcp(): CursorMcpApi | undefined {
  const cursor = (vscode as typeof vscode & { cursor?: { mcp?: CursorMcpApi } })
    .cursor;
  return cursor?.mcp;
}

export function isMcpEnabled(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>(ENABLED_KEY, true);
}

export async function setMcpEnabled(
  context: vscode.ExtensionContext,
  enabled: boolean
): Promise<void> {
  await context.globalState.update(ENABLED_KEY, enabled);
}

function resolveMcpEntry(extensionPath: string): string | undefined {
  const entry = path.join(extensionPath, "out-mcp", "index.js");
  if (fs.existsSync(entry)) {
    return entry;
  }
  return undefined;
}

function nodeAvailable(): boolean {
  try {
    execFileSync("node", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function quietUnregister(mcp: CursorMcpApi): void {
  try {
    mcp.unregisterServer(MCP_SERVER_NAME);
  } catch {
    // ignore
  }
}

export async function registerVtexMcp(
  context: vscode.ExtensionContext,
  options?: { quiet?: boolean }
): Promise<boolean> {
  const mcp = getCursorMcp();
  if (!mcp?.registerServer) {
    if (!options?.quiet) {
      vscode.window.showErrorMessage(
        "Cursor MCP extension API is unavailable. Open this in Cursor (not stock VS Code) to auto-register the vtex MCP."
      );
    }
    return false;
  }

  if (!isMcpEnabled(context)) {
    quietUnregister(mcp);
    if (!options?.quiet) {
      vscode.window.showInformationMessage(
        "VTEX MCP is disabled. Run “VTEX: Enable MCP” to register it."
      );
    }
    return false;
  }

  if (!nodeAvailable()) {
    if (!options?.quiet) {
      vscode.window.showErrorMessage(
        "Node.js was not found on PATH. Install Node.js 20+ so Cursor can launch the bundled VTEX MCP server."
      );
    }
    return false;
  }

  const mcpEntry = resolveMcpEntry(context.extensionPath);
  if (!mcpEntry) {
    if (!options?.quiet) {
      vscode.window.showErrorMessage(
        "Bundled MCP server missing (out-mcp/index.js). Run `npm run compile` in the extension folder, then reload."
      );
    }
    return false;
  }

  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const project = folder ? discoverProjectAccount(folder) : null;
  if (!project) {
    quietUnregister(mcp);
    if (!options?.quiet) {
      vscode.window.showInformationMessage(
        "VTEX MCP inactive: open a FastStore/IO project (discovery.config storeId, .vtex-mcp.json, or manifest vendor)."
      );
    }
    return false;
  }

  const accountsJson = await buildProjectAccountsJson(context, project.account);
  if (!accountsJson) {
    quietUnregister(mcp);
    if (!options?.quiet) {
      vscode.window.showInformationMessage(
        `VTEX MCP inactive: no AppKey/AppToken saved for project account “${project.account}”. Run VTEX: Add Account.`
      );
    }
    return false;
  }

  const config = vscode.workspace.getConfiguration("vtexMcp");
  const env: Record<string, string> = {
    VTEX_ACCOUNTS_JSON: accountsJson,
    VTEX_ENVIRONMENT: config.get<string>("environment") || "vtexcommercestable",
    VTEX_MCP_WORKSPACE_ROOT: folder!,
  };
  const fsUrl = config.get<string>("faststoreGraphqlUrl");
  if (fsUrl?.trim()) {
    env.VTEX_FASTSTORE_GRAPHQL_URL = fsUrl.trim();
  }

  try {
    quietUnregister(mcp);
    mcp.registerServer({
      name: MCP_SERVER_NAME,
      server: {
        command: "node",
        args: [mcpEntry],
        env,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!options?.quiet) {
      vscode.window.showErrorMessage(`Failed to register VTEX MCP: ${message}`);
    }
    return false;
  }

  if (!options?.quiet) {
    vscode.window.showInformationMessage(
      `VTEX MCP registered for project account “${project.account}”.`
    );
  }
  return true;
}

export async function unregisterVtexMcp(
  context: vscode.ExtensionContext,
  options?: { quiet?: boolean }
): Promise<boolean> {
  const mcp = getCursorMcp();
  if (!mcp?.unregisterServer) {
    if (!options?.quiet) {
      vscode.window.showErrorMessage(
        "Cursor MCP extension API is unavailable."
      );
    }
    return false;
  }

  try {
    mcp.unregisterServer(MCP_SERVER_NAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!options?.quiet) {
      vscode.window.showErrorMessage(
        `Failed to unregister VTEX MCP: ${message}`
      );
    }
    return false;
  }

  await setMcpEnabled(context, false);
  if (!options?.quiet) {
    vscode.window.showInformationMessage("VTEX MCP unregistered.");
  }
  return true;
}

export async function maybeAutoRegister(
  context: vscode.ExtensionContext
): Promise<void> {
  const auto = vscode.workspace
    .getConfiguration("vtexMcp")
    .get<boolean>("autoRegister", true);
  if (!auto || !isMcpEnabled(context)) {
    return;
  }
  await registerVtexMcp(context, { quiet: true });
}
