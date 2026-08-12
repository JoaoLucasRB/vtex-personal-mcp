import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAll } from "./tools/register";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "vtex",
    version: "0.3.1",
    instructions:
      "MCP server for VTEX APIs. Uses ONLY the open project account " +
      "(FastStore discovery.config api.storeId, .vtex-mcp.json, or IO " +
      "manifest vendor). There is no account= override and Toolbelt login " +
      "is display-only. If that project account has no saved AppKey/AppToken, " +
      "the extension leaves MCP unregistered and tools return skipped. " +
      "GraphQL: graphql_search_*, graphql_io_*, graphql_faststore_*. " +
      "REST tools use domain_resource_action names. Use get_vtex_context.",
  });

  registerAll(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
