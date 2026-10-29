/**
 * Error type that is safe to expose to the client.
 * `status` is the HTTP status code returned by the Route Handler.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly headers?: Record<string, string>;

  constructor(status: number, message: string, headers?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.headers = headers;
  }
}
