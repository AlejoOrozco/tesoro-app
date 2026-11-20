import type { ReactNode } from "react";

interface AuthCardProps {
  readonly title: string;
  readonly wwwOriginUrl: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function AuthCard({ title, wwwOriginUrl, children, footer }: AuthCardProps) {
  return (
    <main className="auth-screen">
      <section className="card">
        <p className="brand">Tesoro</p>
        <h1>{title}</h1>
        {children}
        {footer ? <div className="links">{footer}</div> : null}
        <div className="links">
          <a href={wwwOriginUrl}>Volver al sitio</a>
        </div>
      </section>
    </main>
  );
}
