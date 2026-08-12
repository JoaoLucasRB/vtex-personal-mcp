import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { ConfigError } from "./errors";

export type AccountCredentials = {
  account: string;
  appKey: string;
  appToken: string;
};

export type VtexConfig = {
  account: string;
  appKey: string;
  appToken: string;
  environment: string;
};

export type AccountsStore = {
  accounts: Record<string, AccountCredentials>;
  environment: string;
  sourcePath: string | null;
  legacyEnv: boolean;
  fromEnvJson: boolean;
};

export function accountNames(store: AccountsStore): string[] {
  return Object.keys(store.accounts).sort((a, b) => a.localeCompare(b));
}

export function getAccount(
  store: AccountsStore,
  account: string
): AccountCredentials {
  const key = account.trim().toLowerCase();
  for (const [name, creds] of Object.entries(store.accounts)) {
    if (name.toLowerCase() === key) {
      return creds;
    }
  }
  const configured = accountNames(store).join(", ") || "(none)";
  throw new ConfigError(
    `No credentials configured for account '${account}'. ` +
      `Configured accounts: ${configured}. ` +
      "Set VTEX_ACCOUNTS_JSON, add ~/.vtex-mcp/accounts.json " +
      "(or VTEX_MCP_ACCOUNTS_FILE), or use the VTEX MCP Cursor extension."
  );
}

export function toConfig(store: AccountsStore, account: string): VtexConfig {
  const creds = getAccount(store, account);
  return {
    account: creds.account,
    appKey: creds.appKey,
    appToken: creds.appToken,
    environment: store.environment,
  };
}

export function baseUrl(config: VtexConfig): string {
  return `https://${config.account}.${config.environment}.com.br`;
}

export function defaultAccountsPath(): string {
  const override = (process.env.VTEX_MCP_ACCOUNTS_FILE || "").trim();
  if (override) {
    return path.resolve(override.replace(/^~(?=$|[\\/])/, os.homedir()));
  }
  return path.join(os.homedir(), ".vtex-mcp", "accounts.json");
}

function credentialsFromMapping(
  account: string,
  raw: Record<string, unknown>
): AccountCredentials {
  const appKey = String(raw.appKey ?? raw.app_key ?? "").trim();
  const appToken = String(raw.appToken ?? raw.app_token ?? "").trim();
  if (!appKey || !appToken) {
    throw new ConfigError(`Account '${account}' is missing appKey/appToken.`);
  }
  return {
    account: account.trim(),
    appKey,
    appToken,
  };
}

function storeFromDict(
  data: Record<string, unknown>,
  sourceLabel: string,
  options: { sourcePath?: string | null; fromEnvJson?: boolean } = {}
): AccountsStore {
  const rawAccounts = data.accounts;
  if (
    !rawAccounts ||
    typeof rawAccounts !== "object" ||
    Array.isArray(rawAccounts) ||
    Object.keys(rawAccounts).length === 0
  ) {
    throw new ConfigError(
      `${sourceLabel} must include a non-empty 'accounts' object.`
    );
  }

  const accounts: Record<string, AccountCredentials> = {};
  for (const [name, raw] of Object.entries(
    rawAccounts as Record<string, unknown>
  )) {
    if (!name.trim()) {
      throw new ConfigError("Account names must be non-empty strings.");
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new ConfigError(
        `Account '${name}' must be an object with appKey/appToken.`
      );
    }
    const creds = credentialsFromMapping(
      name.trim(),
      raw as Record<string, unknown>
    );
    accounts[creds.account] = creds;
  }

  const environment =
    String(data.environment || "vtexcommercestable").trim() ||
    "vtexcommercestable";

  return {
    accounts,
    environment,
    sourcePath: options.sourcePath ?? null,
    legacyEnv: false,
    fromEnvJson: options.fromEnvJson ?? false,
  };
}

function loadFromEnvJson(): AccountsStore | null {
  const raw = (process.env.VTEX_ACCOUNTS_JSON || "").trim();
  if (!raw) {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new ConfigError(
      `Invalid JSON in VTEX_ACCOUNTS_JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ConfigError("VTEX_ACCOUNTS_JSON must contain a JSON object.");
  }
  return storeFromDict(data as Record<string, unknown>, "VTEX_ACCOUNTS_JSON", {
    fromEnvJson: true,
  });
}

function loadFromFile(filePath: string): AccountsStore | null {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new ConfigError(
      `Invalid JSON in accounts file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ConfigError(
      `Accounts file ${filePath} must contain a JSON object.`
    );
  }
  return storeFromDict(data as Record<string, unknown>, `Accounts file ${filePath}`, {
    sourcePath: filePath,
  });
}

function loadFromLegacyEnv(): AccountsStore | null {
  const account = (process.env.VTEX_ACCOUNT || "").trim();
  const appKey = (process.env.VTEX_APP_KEY || "").trim();
  const appToken = (process.env.VTEX_APP_TOKEN || "").trim();
  if (!account || !appKey || !appToken) {
    return null;
  }
  const environment =
    (process.env.VTEX_ENVIRONMENT || "vtexcommercestable").trim() ||
    "vtexcommercestable";
  return {
    accounts: {
      [account]: { account, appKey, appToken },
    },
    environment,
    sourcePath: null,
    legacyEnv: true,
    fromEnvJson: false,
  };
}

function applyEnvOverrides(store: AccountsStore): AccountsStore {
  const envEnvironment = (process.env.VTEX_ENVIRONMENT || "").trim();
  if (!envEnvironment || envEnvironment === store.environment) {
    return store;
  }
  return {
    ...store,
    environment: envEnvironment,
  };
}

export function loadAccountsStore(): AccountsStore {
  const filePath = defaultAccountsPath();
  let store =
    loadFromEnvJson() ?? loadFromFile(filePath) ?? loadFromLegacyEnv();

  if (!store) {
    throw new ConfigError(
      "No VTEX credentials configured. Set VTEX_ACCOUNTS_JSON, create " +
        `${filePath} (see accounts.example.json), use the VTEX MCP Cursor ` +
        "extension, or set VTEX_ACCOUNT / VTEX_APP_KEY / VTEX_APP_TOKEN."
    );
  }

  return applyEnvOverrides(store);
}

export function validateCredentialsAvailable(): void {
  loadAccountsStore();
}
