import { getAppConfig } from "@/lib/app-config";
import { destinationForRole } from "@/lib/roles";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface SessionLook {
  readonly status: number;
  readonly role: string | null;
}

function readRole(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("role" in body)) return null;
  const role = body.role;
  if (typeof role !== "string" || role.length === 0) return null;
  return role;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const value: unknown = await response.json();
    return value;
  } catch {
    return null;
  }
}

async function readSession(apiOriginUrl: string): Promise<SessionLook | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const headers: HeadersInit = cookieHeader.length > 0 ? { cookie: cookieHeader } : {};

  try {
    const response = await fetch(`${apiOriginUrl}/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const body = response.status === 200 ? await readJson(response) : null;
    return { status: response.status, role: readRole(body) };
  } catch {
    return null;
  }
}

export default async function Home() {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  const session = await readSession(apiOriginUrl);

  if (session?.status === 401) redirect("/login");
  if (session?.status === 200 && session.role) {
    redirect(destinationForRole(session.role, wwwOriginUrl));
  }

  return (
    <main className="status-screen">
      <p>No se pudo verificar la sesión.</p>
    </main>
  );
}
