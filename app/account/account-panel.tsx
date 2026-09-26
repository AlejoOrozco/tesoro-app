"use client";

import { getMe, type AuthSession } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";
import { signOut } from "@/lib/sign-out";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccountPanelProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
}

export function AccountPanel({ apiOriginUrl, wwwOriginUrl }: AccountPanelProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadSession(): Promise<void> {
      const result = await getMe(apiOriginUrl);
      if (!isCurrent) return;
      if (!result.ok && result.status === 401) {
        router.replace("/login");
        return;
      }
      if (!result.ok) {
        setErrorMessage(result.message);
        setIsLoading(false);
        return;
      }
      setCsrfToken(result.session.csrfToken);
      setSession(result.session);
      setIsLoading(false);
    }

    void loadSession();
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, router]);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);
    await signOut(apiOriginUrl);
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main>
        <p>Cargando…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Cuenta</h1>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {session ? (
        <>
          <p>Correo electrónico: {session.email}</p>
          <p>Rol: {session.role}</p>
          <button type="button" onClick={() => void handleSignOut()} disabled={isSigningOut}>
            Cerrar sesión
          </button>
        </>
      ) : null}
      <p>
        <a href={wwwOriginUrl}>Volver al sitio</a>
      </p>
    </main>
  );
}
