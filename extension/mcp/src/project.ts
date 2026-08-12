import * as fs from "fs";
import * as path from "path";

export type ProjectAccount = {
  account: string;
  source: string;
  path: string;
};

function directoriesUp(start: string): string[] {
  const result: string[] = [];
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

function workspaceRoot(): string {
  const fromEnv = (process.env.VTEX_MCP_WORKSPACE_ROOT || "").trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return process.cwd();
}

function readVtexMcpAccount(filePath: string): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
      string,
      unknown
    >;
    if (typeof data.account === "string" && data.account.trim()) {
      return data.account.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function readManifestVendor(filePath: string): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
      string,
      unknown
    >;
    if (typeof data.vendor === "string" && data.vendor.trim()) {
      return data.vendor.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

/** Extract api.storeId from FastStore discovery.config.js / .ts without evaluating JS. */
function readFastStoreStoreId(filePath: string): string | null {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    const match = text.match(
      /storeId\s*:\s*['"]([A-Za-z0-9_-]+)['"]/
    );
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

export function discoverProjectAccount(
  start?: string
): ProjectAccount | null {
  const dirs = directoriesUp(start || workspaceRoot());

  for (const directory of dirs) {
    const mcpFile = path.join(directory, ".vtex-mcp.json");
    if (fs.existsSync(mcpFile) && fs.statSync(mcpFile).isFile()) {
      const account = readVtexMcpAccount(mcpFile);
      if (account) {
        return { account, source: ".vtex-mcp.json", path: mcpFile };
      }
    }
  }

  for (const directory of dirs) {
    for (const name of ["discovery.config.js", "discovery.config.ts"]) {
      const discovery = path.join(directory, name);
      if (fs.existsSync(discovery) && fs.statSync(discovery).isFile()) {
        const storeId = readFastStoreStoreId(discovery);
        if (storeId) {
          return {
            account: storeId,
            source: `${name}:api.storeId`,
            path: discovery,
          };
        }
      }
    }
  }

  for (const directory of dirs) {
    const manifest = path.join(directory, "manifest.json");
    if (fs.existsSync(manifest) && fs.statSync(manifest).isFile()) {
      const vendor = readManifestVendor(manifest);
      if (vendor) {
        return {
          account: vendor,
          source: "manifest.json:vendor",
          path: manifest,
        };
      }
    }
  }

  return null;
}

export function getWorkspaceRoot(): string {
  return workspaceRoot();
}
