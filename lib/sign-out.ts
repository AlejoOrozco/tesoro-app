import { getMe, logout } from "@/lib/auth-api";
import { clearCsrfToken, getCsrfToken, setCsrfToken } from "@/lib/csrf-token";

async function retryLogout(apiOriginUrl: string): Promise<void> {
  const session = await getMe(apiOriginUrl);
  if (!session.ok) return;
  setCsrfToken(session.session.csrfToken);
  await logout(apiOriginUrl, session.session.csrfToken);
}

export async function signOut(apiOriginUrl: string): Promise<void> {
  const first = await logout(apiOriginUrl, getCsrfToken() ?? "");
  if (!first.ok && first.status === 403) {
    await retryLogout(apiOriginUrl);
  }
  clearCsrfToken();
}
