import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { ConfirmationPanel } from "./confirmation-panel";

export const metadata: Metadata = {
  title: "Pedido confirmado",
};

interface ConfirmationPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const { apiOriginUrl } = getAppConfig();
  return <ConfirmationPanel apiOriginUrl={apiOriginUrl} orderId={id} />;
}
