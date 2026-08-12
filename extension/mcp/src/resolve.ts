import {
  getAccount,
  loadAccountsStore,
  toConfig,
  type AccountsStore,
  type VtexConfig,
} from "./accounts";
import { ConfigError } from "./errors";
import {
  discoverProjectAccount,
  getWorkspaceRoot,
  type ProjectAccount,
} from "./project";
import { readToolbeltSession } from "./session";

export type ResolveSource = "project";

export type ResolvedAccount = {
  account: string;
  source: ResolveSource;
  config: VtexConfig;
};

/** Resolve the open project account only (no explicit account override). */
export function resolveAccount(
  options: {
    store?: AccountsStore;
    project?: ProjectAccount | null;
    discoverProject?: boolean;
  } = {}
): ResolvedAccount {
  const accounts = options.store ?? loadAccountsStore();

  let found: ProjectAccount | null;
  if (options.project !== undefined) {
    found = options.project;
  } else if (options.discoverProject !== false) {
    found = discoverProjectAccount();
  } else {
    found = null;
  }

  if (!found) {
    throw new ConfigError(
      "No project account was found for the open workspace. " +
        'Add .vtex-mcp.json with {"account": "..."}, a FastStore ' +
        "discovery.config.js with api.storeId, or a VTEX IO " +
        "manifest.json with vendor. " +
        `Workspace root: ${getWorkspaceRoot()}`
    );
  }

  return {
    account: getAccount(accounts, found.account).account,
    source: "project",
    config: toConfig(accounts, found.account),
  };
}

/** Returns null when there is no project account or no credentials for it. */
export function tryResolveAccount(
  options: {
    store?: AccountsStore;
    project?: ProjectAccount | null;
    discoverProject?: boolean;
  } = {}
): ResolvedAccount | null {
  try {
    return resolveAccount(options);
  } catch (error) {
    if (error instanceof ConfigError) {
      return null;
    }
    throw error;
  }
}

export function buildContextPayload(): Record<string, unknown> {
  let store: AccountsStore | null = null;
  let storeError: string | null = null;
  try {
    store = loadAccountsStore();
  } catch (error) {
    storeError =
      error instanceof ConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
  }

  const session = readToolbeltSession();
  const project = discoverProjectAccount();

  let defaultResolved: { account: string; source: string } | null = null;
  let defaultResolveError: string | null = storeError;
  if (store) {
    try {
      const resolved = resolveAccount({
        store,
        project,
        discoverProject: false,
      });
      defaultResolved = {
        account: resolved.account,
        source: resolved.source,
      };
    } catch (error) {
      if (error instanceof ConfigError) {
        defaultResolveError = error.message;
      } else {
        throw error;
      }
    }
  }

  return {
    accountResolution: "project only (Toolbelt login is display-only)",
    environment: store?.environment ?? null,
    workspaceRoot: getWorkspaceRoot(),
    accountsFile: store?.sourcePath ?? null,
    fromEnvJson: store?.fromEnvJson ?? false,
    legacyEnvCredentials: store?.legacyEnv ?? false,
    configuredAccounts: store
      ? Object.keys(store.accounts).sort((a, b) => a.localeCompare(b))
      : [],
    loggedIn: {
      account: session.account,
      login: session.login,
      currentWorkspace: session.currentWorkspace,
      sessionPath: session.sessionPath,
      note: "Not used for API routing; APIs use the open project account.",
    },
    project: project
      ? {
          account: project.account,
          source: project.source,
          path: project.path,
        }
      : null,
    defaultResolved,
    defaultResolveError,
    active:
      defaultResolved !== null
        ? true
        : false,
  };
}
