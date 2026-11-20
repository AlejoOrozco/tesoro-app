"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import diamond from "../../DiamondGoldNoBackground.png";
import "./dashboard.css";
import { DashboardIcon, PanelIcon } from "./dashboard-icons";
import { DASHBOARD_SECTIONS, isDashboardSectionActive } from "./dashboard-nav";
import { getSidebarExpanded, getSidebarExpandedServer, setSidebarExpanded, subscribeSidebar } from "./sidebar-preference";

interface DashboardShellProps {
  readonly wwwOriginUrl: string;
  readonly email: string | null;
  readonly isSigningOut: boolean;
  readonly onSignOut: (() => void) | null;
  readonly children: ReactNode;
}

interface HeaderProps {
  readonly wwwOriginUrl: string;
  readonly email: string | null;
  readonly isSigningOut: boolean;
  readonly onSignOut: (() => void) | null;
}

export function DashboardShell({ wwwOriginUrl, email, isSigningOut, onSignOut, children }: DashboardShellProps): ReactElement {
  const isExpanded = useSyncExternalStore(subscribeSidebar, getSidebarExpanded, getSidebarExpandedServer);
  const shellClass = isExpanded ? "hub dashboard" : "hub dashboard is-collapsed";

  return (
    <div className={shellClass}>
      <div className="dashboard-field" aria-hidden="true">
        <img src={diamond.src} alt="" className="dashboard-diamond" />
      </div>
      <DashboardHeader wwwOriginUrl={wwwOriginUrl} email={email} isSigningOut={isSigningOut} onSignOut={onSignOut} />
      <DashboardSidebar isExpanded={isExpanded} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}

function DashboardHeader({ wwwOriginUrl, email, isSigningOut, onSignOut }: HeaderProps): ReactElement {
  return (
    <header className="dashboard-header">
      <a className="dashboard-brand" href={wwwOriginUrl}>
        <img src={diamond.src} alt="" />
        <strong>Tesoro</strong>
      </a>
      <div className="dashboard-header-actions">
        {email ? <span className="hint">{email}</span> : null}
        <a href={wwwOriginUrl}>Sitio</a>
        {onSignOut ? (
          <button type="button" className="secondary" onClick={onSignOut} disabled={isSigningOut} aria-busy={isSigningOut}>
            {isSigningOut ? "Cerrando…" : "Cerrar sesión"}
          </button>
        ) : null}
      </div>
    </header>
  );
}

function DashboardSidebar({ isExpanded }: { readonly isExpanded: boolean }): ReactElement {
  const pathname = usePathname();
  const toggleLabel = isExpanded ? "Solo iconos" : "Mostrar nombres";

  return (
    <aside className="dashboard-sidebar">
      <nav className="dashboard-nav" aria-label="Secciones">
        {DASHBOARD_SECTIONS.map((section) => (
          <Link
            key={section.href}
            className="dashboard-link"
            href={section.href}
            aria-label={section.label}
            aria-current={isDashboardSectionActive(pathname, section.href) ? "page" : undefined}
          >
            <DashboardIcon name={section.icon} />
            <span className="dashboard-label">{section.label}</span>
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="dashboard-toggle secondary"
        aria-pressed={isExpanded}
        aria-label={toggleLabel}
        onClick={() => setSidebarExpanded(!isExpanded)}
      >
        <PanelIcon />
        <span className="dashboard-label">{toggleLabel}</span>
      </button>
    </aside>
  );
}
