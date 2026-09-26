import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { AccountPanel } from "./account-panel";

export const metadata: Metadata = {
  title: "Cuenta",
};

export default function AccountPage() {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  return <AccountPanel apiOriginUrl={apiOriginUrl} wwwOriginUrl={wwwOriginUrl} />;
}
