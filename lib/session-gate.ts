import { getMe } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";

export type SessionGate =
  | { readonly status: "ready"; readonly role: string }
  | { readonly status: "unauthorized" }
  | { readonly status: "error"; readonly message: string };

export async function readSessionGate(apiOriginUrl: string): Promise<SessionGate> {
  const result = await getMe(apiOriginUrl);
  if (!result.ok && result.status === 401) return { status: "unauthorized" };
  if (!result.ok) return { status: "error", message: result.message };
  setCsrfToken(result.session.csrfToken);
  return { status: "ready", role: result.session.role };
}
