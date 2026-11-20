import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { ProductCreateForm } from "./product-create-form";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default function NewProductPage() {
  const { apiOriginUrl } = getAppConfig();
  return <ProductCreateForm apiOriginUrl={apiOriginUrl} />;
}
