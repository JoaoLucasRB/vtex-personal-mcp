import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { accountNames, loadAccountsStore } from "../accounts";
import { buildContextPayload } from "../resolve";
import { asText, errorText, textResult } from "../tooling";

export function registerAccountTools(server: McpServer): void {
  server.tool(
    "get_vtex_context",
    "Show VTEX account context: open project account, whether MCP is active (project has credentials), workspace root, and Toolbelt login (display-only).",
    {},
    async () => {
      try {
        return textResult(asText(buildContextPayload()));
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );

  server.tool(
    "list_vtex_accounts",
    "List configured VTEX account names that have AppKey/AppToken credentials (MCP only activates for the open project account).",
    {},
    async () => {
      try {
        const store = loadAccountsStore();
        return textResult(
          asText({
            accounts: accountNames(store),
            environment: store.environment,
            accountsFile: store.sourcePath,
            fromEnvJson: store.fromEnvJson,
            legacyEnvCredentials: store.legacyEnv,
            accountResolution: "project only",
          })
        );
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );
}
