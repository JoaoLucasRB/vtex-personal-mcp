import { baseUrl, type VtexConfig } from "./accounts";
import { VtexApiError } from "./errors";

export class VtexClient {
  private readonly config: VtexConfig;
  private readonly timeoutMs: number;

  constructor(config: VtexConfig, timeoutMs = 30_000) {
    this.config = config;
    this.timeoutMs = timeoutMs;
  }

  get account(): string {
    return this.config.account;
  }

  async get(pathname: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<unknown> {
    return this.request("GET", withQuery(pathname, query));
  }

  async post(pathname: string, jsonBody?: unknown): Promise<unknown> {
    return this.request("POST", pathname, jsonBody);
  }

  async put(pathname: string, jsonBody?: unknown): Promise<unknown> {
    return this.request("PUT", pathname, jsonBody);
  }

  async patch(pathname: string, jsonBody?: unknown): Promise<unknown> {
    return this.request("PATCH", pathname, jsonBody);
  }

  async delete(pathname: string): Promise<unknown> {
    return this.request("DELETE", pathname);
  }

  private async request(
    method: string,
    pathname: string,
    jsonBody?: unknown
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${baseUrl(this.config)}${pathname}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-VTEX-API-AppKey": this.config.appKey,
          "X-VTEX-API-AppToken": this.config.appToken,
        },
        body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
        signal: controller.signal,
      });
      return await this.parseResponse(response);
    } finally {
      clearTimeout(timer);
    }
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (response.ok) {
      return body;
    }

    let message: string;
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const obj = body as Record<string, unknown>;
      message = String(
        obj.Message ??
          obj.message ??
          obj.error ??
          obj.ExceptionMessage ??
          text ??
          response.statusText
      );
    } else {
      message = text || response.statusText;
    }

    throw new VtexApiError(response.status, message, body);
  }
}

function withQuery(
  pathname: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!query) {
    return pathname;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** IO GraphQL gateway on myvtex.com (segment = public storefront schema). */
export async function postIoGraphql(
  config: VtexConfig,
  options: {
    query: string;
    variables?: Record<string, unknown>;
    provider?: string;
    timeoutMs?: number;
  }
): Promise<unknown> {
  let query = options.query.trim();
  if (options.provider && !/@context\s*\(/.test(query)) {
    query = injectProviderContext(query, options.provider);
  }

  const url = `https://${config.account}.myvtex.com/_v/segment/graphql/v1`;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30_000
  );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": config.appKey,
        "X-VTEX-API-AppToken": config.appToken,
      },
      body: JSON.stringify({
        query,
        variables: options.variables ?? {},
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!response.ok) {
      throw new VtexApiError(
        response.status,
        typeof body === "object" && body && "message" in body
          ? String((body as { message: unknown }).message)
          : text || response.statusText,
        body
      );
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function postFaststoreGraphql(options: {
  url: string;
  query: string;
  variables?: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30_000
  );
  try {
    const response = await fetch(options.url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: options.query,
        variables: options.variables ?? {},
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!response.ok) {
      throw new VtexApiError(
        response.status,
        text || response.statusText,
        body
      );
    }
    return body;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        /ECONNREFUSED|fetch failed|network/i.test(error.message))
    ) {
      throw new VtexApiError(
        0,
        `FastStore GraphQL unreachable at ${options.url}. ` +
          "Start the storefront with yarn develop (or set vtexMcp.faststoreGraphqlUrl).",
        null
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Inject @context(provider: "...") on the first root field of a simple query/mutation.
 * If injection fails, returns the original query unchanged.
 */
function injectProviderContext(query: string, provider: string): string {
  const directive = ` @context(provider: "${provider}")`;
  // Match first field after query/mutation { ... fieldName( or fieldName {
  const re =
    /(\b(?:query|mutation|subscription)\b[^{]*\{\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*(?:\(|\{))/;
  if (re.test(query)) {
    return query.replace(re, `$1$2${directive}$3`);
  }
  // Shorthand: { fieldName(...) { ... } }
  const short = /(\{\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*(?:\(|\{))/;
  if (short.test(query)) {
    return query.replace(short, `$1$2${directive}$3`);
  }
  return query;
}
