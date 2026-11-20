import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ProductsPanel } from "./products-panel";

export const metadata: Metadata = {
  title: "Productos",
};

export default function ProductsPage(): ReactElement {
  const { apiOriginUrl } = getAppConfig();
  return <ProductsPanel apiOriginUrl={apiOriginUrl} />;
}
