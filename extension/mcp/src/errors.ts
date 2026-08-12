export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class VtexApiError extends Error {
  statusCode: number;
  body: unknown;

  constructor(statusCode: number, message: string, body: unknown = null) {
    super(`VTEX API error ${statusCode}: ${message}`);
    this.name = "VtexApiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}
