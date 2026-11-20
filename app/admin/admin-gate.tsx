"use client";

import { getMe, type AuthSession } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";
import { isAdministrator } from "@/lib/roles";
import { signOut } from "@/lib/sign-out";
import { DashboardShell } from "./dashboard-shell";
import { PanelSkeleton } from "./empty-state";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

interface AdminGateProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
  readonly children: ReactNode;
}

export function AdminGate({ apiOriginUrl, wwwOriginUrl, children }: AdminGateProps) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
  }, [apiOriginUrl, attempt, router]);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);
    await signOut(apiOriginUrl);
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <DashboardShell wwwOriginUrl={wwwOriginUrl} email={null} isSigningOut={false} onSignOut={null}>
        <PanelSkeleton />
      </DashboardShell>
    );
  }

  if (!session) {
    return (
      <DashboardShell wwwOriginUrl={wwwOriginUrl} email={null} isSigningOut={false} onSignOut={null}>
        <section className="panel dashboard-status">
          <p className="alert" role="alert">{errorMessage}</p>
          <button type="button" onClick={() => { setErrorMessage(null); setIsLoading(true); setAttempt((value) => value + 1); }}>
            Reintentar
          </button>
        </section>
      </DashboardShell>
    );
  }

  if (!isAdministrator(session.role)) {
    return (
      <DashboardShell wwwOriginUrl={wwwOriginUrl} email={session.email} isSigningOut={isSigningOut} onSignOut={() => void handleSignOut()}>
        <section className="panel stack dashboard-status">
          <h1 className="dashboard-title">Sin acceso</h1>
          <p>No tienes acceso a esta sección. Tu sesión sigue activa.</p>
          <div className="links">
            <Link href="/account">Cuenta</Link>
            <a href={wwwOriginUrl}>Volver al sitio</a>
          </div>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell wwwOriginUrl={wwwOriginUrl} email={session.email} isSigningOut={isSigningOut} onSignOut={() => void handleSignOut()}>
      {children}
    </DashboardShell>
  );
}
