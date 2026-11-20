import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { CheckoutPanel } from "./checkout-panel";

export const metadata: Metadata = {
  title: "Pedido",
};

export default function CheckoutPage() {
  const { apiOriginUrl } = getAppConfig();
  return <CheckoutPanel apiOriginUrl={apiOriginUrl} />;
}
