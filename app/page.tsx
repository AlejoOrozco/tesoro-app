import { getAppConfig } from "@/lib/app-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function readSessionStatus(apiOriginUrl: string): Promise<number | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const headers: HeadersInit = cookieHeader.length > 0 ? { cookie: cookieHeader } : {};

  try {
    const response = await fetch(`${apiOriginUrl}/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    return response.status;
  } catch {
    return null;
  }
}

export default async function Home() {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  const status = await readSessionStatus(apiOriginUrl);

  if (status === 401) redirect("/login");
  if (status === 200) redirect(wwwOriginUrl);

  return (
    <main>
      <p>No se pudo verificar la sesión.</p>
    </main>
  );
}
