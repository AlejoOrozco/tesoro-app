import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { CartPanel } from "./cart-panel";

export const metadata: Metadata = {
  title: "Carrito",
};

export default function CartPage() {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  return <CartPanel apiOriginUrl={apiOriginUrl} wwwOriginUrl={wwwOriginUrl} />;
}
