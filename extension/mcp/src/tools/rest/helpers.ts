import { z, type ZodRawShape } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { VtexClient } from "../../client";
import { errorText, runWithAccount, textResult } from "../../tooling";

type Handler = (
  client: VtexClient,
  args: Record<string, unknown>
) => Promise<unknown>;

export function registerAccountedTool(
  server: McpServer,
  name: string,
  description: string,
  shape: ZodRawShape,
  handler: Handler
): void {
  server.tool(name, description, shape, async (args) => {
    try {
      const text = await runWithAccount((client) =>
        handler(client, args as Record<string, unknown>)
      );
      return textResult(text);
    } catch (error) {
      return textResult(errorText(error));
    }
  });
}

export function jsonBodySchema(
  description = "JSON body as object fields via bodyJson string."
): ZodRawShape {
  return {
    bodyJson: z
      .string()
      .describe(
        `${description} Pass a JSON object string for the request body.`
      ),
  };
}

export function parseBodyJson(bodyJson: string): Record<string, unknown> {
  const parsed = JSON.parse(bodyJson) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("bodyJson must be a JSON object string.");
  }
  return parsed as Record<string, unknown>;
}

export const zStr = z.string();
export const zNum = z.number().int();
