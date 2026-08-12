import * as vscode from "vscode";

const ACCOUNT_NAMES_KEY = "vtexMcp.accountNames";

export type StoredAccount = {
  account: string;
  appKey: string;
  appToken: string;
};

function secretKey(account: string): string {
  return `vtexMcp.account.${account.toLowerCase()}`;
}

export async function listAccountNames(
  context: vscode.ExtensionContext
): Promise<string[]> {
  const names = context.globalState.get<string[]>(ACCOUNT_NAMES_KEY, []);
  return [...names].sort((a, b) => a.localeCompare(b));
}

export async function getAccount(
  context: vscode.ExtensionContext,
  account: string
): Promise<StoredAccount | undefined> {
  const raw = await context.secrets.get(secretKey(account));
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as StoredAccount;
    if (!parsed?.account || !parsed?.appKey || !parsed?.appToken) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export async function upsertAccount(
  context: vscode.ExtensionContext,
  account: StoredAccount
): Promise<void> {
  const normalized: StoredAccount = {
    account: account.account.trim(),
    appKey: account.appKey.trim(),
    appToken: account.appToken.trim(),
  };
  if (!normalized.account || !normalized.appKey || !normalized.appToken) {
    throw new Error("Account, AppKey, and AppToken are required.");
  }

  await context.secrets.store(
    secretKey(normalized.account),
    JSON.stringify(normalized)
  );

  const names = await listAccountNames(context);
  const exists = names.some(
    (n) => n.toLowerCase() === normalized.account.toLowerCase()
  );
  if (!exists) {
    names.push(normalized.account);
    await context.globalState.update(ACCOUNT_NAMES_KEY, names);
  } else {
    const updated = names.map((n) =>
      n.toLowerCase() === normalized.account.toLowerCase()
        ? normalized.account
        : n
    );
    await context.globalState.update(ACCOUNT_NAMES_KEY, updated);
  }
}

export async function removeAccount(
  context: vscode.ExtensionContext,
  account: string
): Promise<boolean> {
  const names = await listAccountNames(context);
  const match = names.find((n) => n.toLowerCase() === account.toLowerCase());
  if (!match) {
    return false;
  }
  await context.secrets.delete(secretKey(match));
  await context.globalState.update(
    ACCOUNT_NAMES_KEY,
    names.filter((n) => n !== match)
  );
  return true;
}

export async function buildAccountsJson(
  context: vscode.ExtensionContext
): Promise<string | undefined> {
  const names = await listAccountNames(context);
  if (names.length === 0) {
    return undefined;
  }

  const config = vscode.workspace.getConfiguration("vtexMcp");
  const accounts: Record<string, { appKey: string; appToken: string }> = {};

  for (const name of names) {
    const stored = await getAccount(context, name);
    if (!stored) {
      continue;
    }
    accounts[stored.account] = {
      appKey: stored.appKey,
      appToken: stored.appToken,
    };
  }

  if (Object.keys(accounts).length === 0) {
    return undefined;
  }

  return JSON.stringify({
    environment: config.get<string>("environment") || "vtexcommercestable",
    accounts,
  });
}

/** Build accounts JSON containing only the given project account (if credentials exist). */
export async function buildProjectAccountsJson(
  context: vscode.ExtensionContext,
  projectAccount: string
): Promise<string | undefined> {
  const stored = await getAccount(context, projectAccount);
  if (!stored) {
    return undefined;
  }
  const config = vscode.workspace.getConfiguration("vtexMcp");
  return JSON.stringify({
    environment: config.get<string>("environment") || "vtexcommercestable",
    accounts: {
      [stored.account]: {
        appKey: stored.appKey,
        appToken: stored.appToken,
      },
    },
  });
}

export async function promptAddAccount(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const account = await vscode.window.showInputBox({
    title: "VTEX: Add Account",
    prompt: "VTEX account name (URL subdomain)",
    placeHolder: "{account}",
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "Account name is required",
  });
  if (!account) {
    return false;
  }

  const existing = await getAccount(context, account);
  if (existing) {
    const overwrite = await vscode.window.showWarningMessage(
      `Account "${existing.account}" already exists. Overwrite?`,
      { modal: true },
      "Overwrite"
    );
    if (overwrite !== "Overwrite") {
      return false;
    }
  }

  const appKey = await vscode.window.showInputBox({
    title: "VTEX: Add Account",
    prompt: `AppKey for ${account.trim()}`,
    placeHolder: "vtexappkey-...",
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "AppKey is required",
  });
  if (!appKey) {
    return false;
  }

  const appToken = await vscode.window.showInputBox({
    title: "VTEX: Add Account",
    prompt: `AppToken for ${account.trim()}`,
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "AppToken is required",
  });
  if (!appToken) {
    return false;
  }

  await upsertAccount(context, {
    account: account.trim(),
    appKey: appKey.trim(),
    appToken: appToken.trim(),
  });
  return true;
}

export async function promptEditAccount(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const names = await listAccountNames(context);
  if (names.length === 0) {
    vscode.window.showInformationMessage("No VTEX accounts saved yet.");
    return false;
  }

  const picked = await vscode.window.showQuickPick(names, {
    title: "VTEX: Edit Account",
    placeHolder: "Select an account to edit",
  });
  if (!picked) {
    return false;
  }

  const current = await getAccount(context, picked);
  if (!current) {
    vscode.window.showErrorMessage(`Could not load credentials for ${picked}.`);
    return false;
  }

  const appKey = await vscode.window.showInputBox({
    title: `VTEX: Edit ${picked}`,
    prompt: "AppKey",
    value: current.appKey,
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim() ? undefined : "AppKey is required",
  });
  if (!appKey) {
    return false;
  }

  const appToken = await vscode.window.showInputBox({
    title: `VTEX: Edit ${picked}`,
    prompt: "AppToken (leave blank to keep current)",
    password: true,
    ignoreFocusOut: true,
  });
  if (appToken === undefined) {
    return false;
  }

  await upsertAccount(context, {
    account: picked,
    appKey: appKey.trim(),
    appToken: appToken.trim() ? appToken.trim() : current.appToken,
  });
  return true;
}

export async function promptRemoveAccount(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const names = await listAccountNames(context);
  if (names.length === 0) {
    vscode.window.showInformationMessage("No VTEX accounts saved yet.");
    return false;
  }

  const picked = await vscode.window.showQuickPick(names, {
    title: "VTEX: Remove Account",
    placeHolder: "Select an account to remove",
  });
  if (!picked) {
    return false;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Remove VTEX account "${picked}"?`,
    { modal: true },
    "Remove"
  );
  if (confirm !== "Remove") {
    return false;
  }

  return removeAccount(context, picked);
}
