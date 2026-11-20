import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly message: string;
  readonly action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty-mark" aria-hidden="true" />
      <p>{message}</p>
      {action}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <section className="panel" aria-busy="true" aria-label="Cargando">
      <div className="skeleton title" />
      <div className="skeleton line" />
      <div className="skeleton line" />
      <div className="skeleton line" />
    </section>
  );
}
