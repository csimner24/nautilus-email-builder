/**
 * Browser-side JSON client for this app's API routes.
 *
 * Centralizes the three things every call site needs: a timeout so a hung
 * request returns control to the user, a body read that survives a non-JSON
 * error page, and a single place that turns a failure into display text.
 */

const DEFAULT_TIMEOUT_MS = 45_000;

/** A non-2xx response. `status` lets callers distinguish 400s from 503s. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  // DOMException is not an Error subclass in browsers, so check both.
  if (error instanceof DOMException) return error.name === "AbortError";
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Fetch and parse JSON, throwing `ApiError` on a non-2xx response.
 *
 * The body is read as text before parsing so an HTML error page (a crashed
 * route, a proxy timeout) reports its real status rather than a JSON syntax
 * error that hides it.
 */
export async function requestJson<T>(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const raw = await response.text();

    let body: unknown = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      throw new ApiError(readErrorMessage(body, response.status), response.status);
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

function readErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const { error } = body as { error?: unknown };
    if (typeof error === "string" && error) return error;
  }
  return `Request failed with status ${status}.`;
}

/** Display text for a failed `requestJson` call. */
export function describeRequestError(error: unknown, fallback: string): string {
  if (isAbortError(error)) return "The request timed out. Please try again.";
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
