import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { OrderDetailPanel } from "./order-detail-panel";

export const metadata: Metadata = {
  title: "Pedido",
};

interface OrderDetailPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const { apiOriginUrl } = getAppConfig();
  return <OrderDetailPanel apiOriginUrl={apiOriginUrl} orderId={id} />;
}
