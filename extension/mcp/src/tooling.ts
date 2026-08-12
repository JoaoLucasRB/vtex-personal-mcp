import { VtexClient } from "./client";
import { ConfigError, VtexApiError } from "./errors";
import { tryResolveAccount } from "./resolve";

export function asText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function errorText(error: unknown): string {
  if (error instanceof VtexApiError) {
    return asText({
      error: error.message,
      status_code: error.statusCode,
      body: error.body,
    });
  }
  if (error instanceof ConfigError) {
    return asText({ error: error.message });
  }
  const message = error instanceof Error ? error.message : String(error);
  return asText({ error: message });
}

export function wrapResult(
  account: string,
  source: string,
  data: unknown
): string {
  return asText({ account, source, data });
}

export function skippedResult(reason: string): string {
  return asText({ skipped: true, reason });
}

/**
 * Run an AppKey-backed operation against the open project account.
 * If the project account is missing or has no credentials, returns a skip payload (do nothing).
 */
export async function runWithAccount(
  operation: (client: VtexClient) => Promise<unknown>
): Promise<string> {
  const resolved = tryResolveAccount();
  if (!resolved) {
    return skippedResult(
      "No authenticated project account. Open a FastStore/IO project and save AppKey/AppToken for that account (VTEX: Add Account), then re-register MCP."
    );
  }
  const client = new VtexClient(resolved.config);
  const data = await operation(client);
  return wrapResult(resolved.account, resolved.source, data);
}

export function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}
