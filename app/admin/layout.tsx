import { getAppConfig } from "@/lib/app-config";
import type { ReactNode } from "react";
import { AdminGate } from "./admin-gate";
import "./surface.css";

interface AdminLayoutProps {
  readonly children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  return (
    <AdminGate apiOriginUrl={apiOriginUrl} wwwOriginUrl={wwwOriginUrl}>
      {children}
    </AdminGate>
  );
}
