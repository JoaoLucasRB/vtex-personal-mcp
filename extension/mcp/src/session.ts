import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export type VtexToolbeltSession = {
  account: string | null;
  login: string | null;
  currentWorkspace: string | null;
  sessionPath: string;
  workspacePath: string;
};

export function toolbeltSessionDir(): string {
  return path.join(os.homedir(), ".vtex", "session");
}

export function readToolbeltSession(): VtexToolbeltSession {
  const sessionDir = toolbeltSessionDir();
  const sessionPath = path.join(sessionDir, "session.json");
  const workspacePath = path.join(sessionDir, "workspace.json");

  let account: string | null = null;
  let login: string | null = null;
  let currentWorkspace: string | null = null;

  if (fs.existsSync(sessionPath) && fs.statSync(sessionPath).isFile()) {
    try {
      const data = JSON.parse(fs.readFileSync(sessionPath, "utf8")) as Record<
        string,
        unknown
      >;
      if (typeof data.account === "string" && data.account.trim()) {
        account = data.account.trim();
      }
      if (typeof data.login === "string" && data.login.trim()) {
        login = data.login.trim();
      }
    } catch {
      // ignore
    }
  }

  if (fs.existsSync(workspacePath) && fs.statSync(workspacePath).isFile()) {
    try {
      const data = JSON.parse(fs.readFileSync(workspacePath, "utf8")) as Record<
        string,
        unknown
      >;
      if (
        typeof data.currentWorkspace === "string" &&
        data.currentWorkspace.trim()
      ) {
        currentWorkspace = data.currentWorkspace.trim();
      }
    } catch {
      // ignore
    }
  }

  return {
    account,
    login,
    currentWorkspace,
    sessionPath,
    workspacePath,
  };
}
