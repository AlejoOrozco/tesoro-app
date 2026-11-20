import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { OrderListPanel } from "./order-list-panel";

export const metadata: Metadata = {
  title: "Pedidos",
};

export default function OrdersPage() {
  const { apiOriginUrl } = getAppConfig();
  return <OrderListPanel apiOriginUrl={apiOriginUrl} />;
}
