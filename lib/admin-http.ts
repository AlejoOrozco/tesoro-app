import { getMe } from "@/lib/auth-api";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf-token";

export type AdminResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly status: number; readonly message: string };

interface AdminCall {
  readonly method: string;
  readonly body?: unknown;
}

interface AdminHttp {
  readonly status: number;
  readonly body: unknown;
}

export const SERVER_UNREACHABLE_MESSAGE = "No se pudo conectar con el servidor.";
const REQUEST_FAILED_MESSAGE = "No se pudo completar la solicitud.";
const CSRF_MISMATCH_MESSAGE = "Invalid CSRF token";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const message = value.message;
  if (typeof message === "string" && message.length > 0) return message;
  return null;
}

export function failed(status: number, body: unknown): AdminResult<never> {
  if (status === 0) return { ok: false, status, message: SERVER_UNREACHABLE_MESSAGE };
  const message = readErrorMessage(body) ?? REQUEST_FAILED_MESSAGE;
  if (message === "Forbidden") {
    return {
      ok: false,
      status,
      message: "No tienes acceso a esta sección. Tu sesión sigue activa.",
    };
  }
  return { ok: false, status, message };
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return null;
  }
}

async function send(apiOriginUrl: string, path: string, call: AdminCall, csrfToken: string): Promise<AdminHttp> {
  const headers: Record<string, string> = { "x-csrf-token": csrfToken };
  const init: RequestInit = { method: call.method, credentials: "include", headers, cache: "no-store" };
  if (call.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(call.body);
  }
  const response = await fetch(`${apiOriginUrl}${path}`, init);
  return { status: response.status, body: await readBody(response) };
}

function isCsrfMismatch(result: AdminHttp): boolean {
  return result.status === 403 && readErrorMessage(result.body) === CSRF_MISMATCH_MESSAGE;
}

export async function adminCall(apiOriginUrl: string, path: string, call: AdminCall): Promise<AdminHttp> {
  try {
    const first = await send(apiOriginUrl, path, call, getCsrfToken() ?? "");
    if (!isCsrfMismatch(first)) return first;
    const session = await getMe(apiOriginUrl);
    if (!session.ok) return first;
    setCsrfToken(session.session.csrfToken);
    return send(apiOriginUrl, path, call, session.session.csrfToken);
  } catch {
    return { status: 0, body: null };
  }
}

export async function publicGet(apiOriginUrl: string, path: string): Promise<AdminHttp> {
  try {
    const response = await fetch(`${apiOriginUrl}${path}`, { method: "GET", cache: "no-store" });
    return { status: response.status, body: await readBody(response) };
  } catch {
    return { status: 0, body: null };
  }
}

