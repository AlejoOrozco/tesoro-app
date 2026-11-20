"use client";

import { AuthCard } from "@/app/auth-card";
import { getMe, type AuthSession } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";
import { isAdministrator } from "@/lib/roles";
import { signOut } from "@/lib/sign-out";
import Link from "next/link";
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
      <main className="auth-screen">
        <section className="card" aria-busy="true" aria-label="Cargando">
          <div className="skeleton title" />
          <div className="skeleton line" />
          <div className="skeleton line" />
        </section>
      </main>
    );
  }

  return (
    <AuthCard
      title="Cuenta"
      wwwOriginUrl={wwwOriginUrl}
      footer={
        session && isAdministrator(session.role) ? <Link href="/admin">Ir al panel</Link> : null
      }
    >
      <div className="stack">
        {errorMessage ? <p className="alert" role="alert">{errorMessage}</p> : null}
        {session ? (
          <>
            <p>Correo electrónico: {session.email}</p>
            <p>Rol: {session.role}</p>
            <Link href="/cart">Carrito</Link>
            <Link href="/orders">Pedidos</Link>
            <button type="button" className="secondary" onClick={() => void handleSignOut()} disabled={isSigningOut} aria-busy={isSigningOut}>
              {isSigningOut ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </>
        ) : null}
      </div>
    </AuthCard>
  );
}
