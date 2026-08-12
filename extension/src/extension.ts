import * as vscode from "vscode";

import {
  listAccountNames,
  promptAddAccount,
  promptEditAccount,
  promptRemoveAccount,
} from "./accounts";
import {
  maybeAutoRegister,
  registerVtexMcp,
  setMcpEnabled,
  unregisterVtexMcp,
} from "./mcp";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  context.subscriptions.push(
    vscode.commands.registerCommand("vtexMcp.addAccount", async () => {
      const changed = await promptAddAccount(context);
      if (changed) {
        vscode.window.showInformationMessage("VTEX account saved.");
        await registerVtexMcp(context, { quiet: true });
      }
    }),
    vscode.commands.registerCommand("vtexMcp.editAccount", async () => {
      const changed = await promptEditAccount(context);
      if (changed) {
        vscode.window.showInformationMessage("VTEX account updated.");
        await registerVtexMcp(context, { quiet: true });
      }
    }),
    vscode.commands.registerCommand("vtexMcp.removeAccount", async () => {
      const changed = await promptRemoveAccount(context);
      if (changed) {
        vscode.window.showInformationMessage("VTEX account removed.");
        await registerVtexMcp(context, { quiet: true });
      }
    }),
    vscode.commands.registerCommand("vtexMcp.listAccounts", async () => {
      const names = await listAccountNames(context);
      if (names.length === 0) {
        vscode.window.showInformationMessage("No VTEX accounts saved yet.");
        return;
      }
      vscode.window.showInformationMessage(
        `VTEX accounts: ${names.join(", ")}`
      );
    }),
    vscode.commands.registerCommand("vtexMcp.enableMcp", async () => {
      await setMcpEnabled(context, true);
      await registerVtexMcp(context);
    }),
    vscode.commands.registerCommand("vtexMcp.disableMcp", async () => {
      await unregisterVtexMcp(context);
    }),
    vscode.commands.registerCommand("vtexMcp.reregisterMcp", async () => {
      await setMcpEnabled(context, true);
      await registerVtexMcp(context);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (
        event.affectsConfiguration("vtexMcp.environment") ||
        event.affectsConfiguration("vtexMcp.autoRegister")
      ) {
        await maybeAutoRegister(context);
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      await maybeAutoRegister(context);
    })
  );

  await maybeAutoRegister(context);
}

export function deactivate(): void {
  // Registration is owned by Cursor for the session; leave server registered.
}
