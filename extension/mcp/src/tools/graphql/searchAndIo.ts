import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { postIoGraphql } from "../../client";
import { tryResolveAccount } from "../../resolve";
import {
  asText,
  errorText,
  skippedResult,
  textResult,
  wrapResult,
} from "../../tooling";
import { ioAllowlist, searchAllowlist } from "./allowlists";

const SEARCH_PROVIDER = "vtex.search-graphql";
const IO_PROVIDER = "vtex.store-graphql";

function parseVariables(raw?: string): Record<string, unknown> | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("variables must be a JSON object string.");
  }
  return parsed as Record<string, unknown>;
}

async function runIoGraphql(options: {
  query: string;
  variables?: string;
  provider: string;
}): Promise<string> {
  const resolved = tryResolveAccount();
  if (!resolved) {
    return skippedResult(
      "No authenticated project account. Open a FastStore/IO project and save AppKey/AppToken for that account (VTEX: Add Account), then re-register MCP."
    );
  }
  const data = await postIoGraphql(resolved.config, {
    query: options.query,
    variables: parseVariables(options.variables),
    provider: options.provider,
  });
  return wrapResult(resolved.account, resolved.source, data);
}

export function registerGraphqlSearchTools(server: McpServer): void {
  server.tool(
    "graphql_search_list",
    "Search GraphQL (vtex.search-graphql): list common Query fields for Intelligent Search / storefront product search. Uses the open project account only.",
    {},
    async () =>
      textResult(
        asText({
          provider: SEARCH_PROVIDER,
          group: "search",
          fields: searchAllowlist,
        })
      )
  );

  server.tool(
    "graphql_search_query",
    "Search GraphQL: run a query against the project account IO gateway with @context(provider: \"vtex.search-graphql\") auto-applied when missing.",
    {
      query: z.string().describe("GraphQL query document."),
      variables: z
        .string()
        .optional()
        .describe(
          'Optional GraphQL variables as a JSON object string, e.g. {"fullText":"cafe"}.'
        ),
    },
    async ({ query, variables }) => {
      try {
        const text = await runIoGraphql({
          query,
          variables,
          provider: SEARCH_PROVIDER,
        });
        return textResult(text);
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );
}

export function registerGraphqlIoTools(server: McpServer): void {
  server.tool(
    "graphql_io_list",
    "IO GraphQL (default vtex.store-graphql): list common Query fields. Use provider= for other installed apps. Uses the open project account only.",
    {},
    async () =>
      textResult(
        asText({
          defaultProvider: IO_PROVIDER,
          group: "io",
          fields: ioAllowlist,
          note: "Pass provider on graphql_io_query for other IO apps installed on the account.",
        })
      )
  );

  server.tool(
    "graphql_io_query",
    "IO GraphQL: run a query against the project account gateway. Default provider vtex.store-graphql; override with provider for other apps.",
    {
      query: z.string().describe("GraphQL query or mutation document."),
      variables: z
        .string()
        .optional()
        .describe("Optional GraphQL variables as a JSON object string."),
      provider: z
        .string()
        .optional()
        .describe(
          'IO app provider, e.g. "vtex.store-graphql" (default), "vtex.orders-graphql".'
        ),
    },
    async ({ query, variables, provider }) => {
      try {
        const text = await runIoGraphql({
          query,
          variables,
          provider: provider?.trim() || IO_PROVIDER,
        });
        return textResult(text);
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );
}
