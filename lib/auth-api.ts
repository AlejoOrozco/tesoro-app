import { toVisitorAuthMessage } from "@/lib/recaptcha";

export interface AuthSession {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly csrfToken: string;
}

export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
  readonly recaptchaToken: string;
}

export type LoginResult =
  | { readonly ok: true; readonly session: AuthSession }
  | { readonly ok: false; readonly message: string };

export type RegisterResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export type MeResult =
  | { readonly ok: true; readonly session: AuthSession }
  | { readonly ok: false; readonly status: number; readonly message: string };

export type LogoutResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: number; readonly message: string };

const SERVER_UNREACHABLE_MESSAGE = "No se pudo conectar con el servidor.";
const REQUEST_FAILED_MESSAGE = "No se pudo completar la solicitud.";

interface ApiResponse {
  readonly status: number;
  readonly body: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

function readAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) return null;
  const id = readString(value, "id");
  const email = readString(value, "email");
  const role = readString(value, "role");
  const csrfToken = readString(value, "csrfToken");
  if (!id || !email || !role || !csrfToken) return null;
  return { id, email, role, csrfToken };
}

function readErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const message = value.message;
  if (typeof message === "string" && message.length > 0) return message;
  if (!Array.isArray(message)) return null;
  const parts = message.filter((part): part is string => typeof part === "string");
  if (parts.length === 0) return null;
  return parts.join(" ");
}

function parseJson(text: string): unknown {
  const value: unknown = JSON.parse(text);
  return value;
}

async function request(url: string, init: RequestInit): Promise<ApiResponse> {
  const response = await fetch(url, { ...init, credentials: "include" });
  if (response.status === 204) return { status: response.status, body: null };
  const text = await response.text();
  if (text.length === 0) return { status: response.status, body: null };
  try {
    return { status: response.status, body: parseJson(text) };
  } catch {
    return { status: response.status, body: null };
  }
}

export async function login(
  apiOriginUrl: string,
  credentials: AuthCredentials,
): Promise<LoginResult> {
  try {
    const { status, body } = await request(`${apiOriginUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const session = readAuthSession(body);
    if (status === 200 && session) return { ok: true, session };
    return { ok: false, message: toVisitorAuthMessage(readErrorMessage(body), REQUEST_FAILED_MESSAGE) };
  } catch {
    return { ok: false, message: SERVER_UNREACHABLE_MESSAGE };
  }
}

export async function register(
  apiOriginUrl: string,
  credentials: AuthCredentials,
): Promise<RegisterResult> {
  try {
    const { status, body } = await request(`${apiOriginUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (status === 201) return { ok: true };
    return { ok: false, message: toVisitorAuthMessage(readErrorMessage(body), REQUEST_FAILED_MESSAGE) };
  } catch {
    return { ok: false, message: SERVER_UNREACHABLE_MESSAGE };
  }
}

export async function getMe(apiOriginUrl: string): Promise<MeResult> {
  try {
    const { status, body } = await request(`${apiOriginUrl}/auth/me`, { method: "GET" });
    const session = readAuthSession(body);
    if (status === 200 && session) return { ok: true, session };
    return {
      ok: false,
      status,
      message: readErrorMessage(body) ?? REQUEST_FAILED_MESSAGE,
    };
  } catch {
    return { ok: false, status: 0, message: SERVER_UNREACHABLE_MESSAGE };
  }
}

export async function logout(apiOriginUrl: string, csrfToken: string): Promise<LogoutResult> {
  try {
    const { status, body } = await request(`${apiOriginUrl}/auth/logout`, {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    if (status === 204) return { ok: true };
    return {
      ok: false,
      status,
      message: readErrorMessage(body) ?? REQUEST_FAILED_MESSAGE,
    };
  } catch {
    return { ok: false, status: 0, message: SERVER_UNREACHABLE_MESSAGE };
  }
}
