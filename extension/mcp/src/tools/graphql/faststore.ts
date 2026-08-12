import * as fs from "fs";
import * as path from "path";

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { postFaststoreGraphql } from "../../client";
import { getWorkspaceRoot } from "../../project";
import { asText, errorText, textResult } from "../../tooling";

function defaultFaststoreUrl(): string {
  return (
    (process.env.VTEX_FASTSTORE_GRAPHQL_URL || "").trim() ||
    "http://localhost:3000/api/graphql"
  );
}

function findGeneratedSchema(start: string): string | null {
  let current = path.resolve(start);
  while (true) {
    const candidate = path.join(
      current,
      ".faststore",
      "@generated",
      "schema.graphql"
    );
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}

function parseRootFields(
  schemaText: string,
  typeName: "Query" | "Mutation"
): string[] {
  const marker = `type ${typeName}`;
  const start = schemaText.indexOf(marker);
  if (start < 0) {
    return [];
  }
  const brace = schemaText.indexOf("{", start);
  if (brace < 0) {
    return [];
  }
  let depth = 0;
  let end = -1;
  for (let i = brace; i < schemaText.length; i++) {
    const ch = schemaText[i];
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) {
    return [];
  }
  const body = schemaText.slice(brace + 1, end);
  const names = new Set<string>();
  const re = /^\s{2}([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(|:)/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    names.add(match[1]);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

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

export function registerGraphqlFaststoreTools(server: McpServer): void {
  server.tool(
    "graphql_faststore_list",
    "FastStore GraphQL: list Query/Mutation roots from the open project's .faststore/@generated/schema.graphql (core + custom typeDefs).",
    {},
    async () => {
      try {
        const root = getWorkspaceRoot();
        const schemaPath = findGeneratedSchema(root);
        if (!schemaPath) {
          return textResult(
            asText({
              group: "faststore",
              error:
                "No .faststore/@generated/schema.graphql found under the workspace. Open a FastStore project and run a build/dev so the schema is generated.",
              workspaceRoot: root,
            })
          );
        }
        const text = fs.readFileSync(schemaPath, "utf8");
        return textResult(
          asText({
            group: "faststore",
            schemaPath,
            query: parseRootFields(text, "Query"),
            mutation: parseRootFields(text, "Mutation"),
            defaultUrl: defaultFaststoreUrl(),
          })
        );
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );

  server.tool(
    "graphql_faststore_query",
    "FastStore GraphQL: POST a query to the local FastStore BFF (default http://localhost:3000/api/graphql). Requires yarn develop (or similar) in the FastStore project.",
    {
      query: z.string().describe("GraphQL query or mutation document."),
      variables: z
        .string()
        .optional()
        .describe("Optional GraphQL variables as a JSON object string."),
      url: z
        .string()
        .optional()
        .describe("Override FastStore GraphQL URL."),
    },
    async ({ query, variables, url }) => {
      try {
        const target = (url || defaultFaststoreUrl()).trim();
        const data = await postFaststoreGraphql({
          url: target,
          query,
          variables: parseVariables(variables),
        });
        return textResult(
          asText({
            group: "faststore",
            url: target,
            data,
          })
        );
      } catch (error) {
        return textResult(errorText(error));
      }
    }
  );
}
