import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import { ProductEditForm } from "./product-edit-form";

export const metadata: Metadata = {
  title: "Editar producto",
};

interface EditProductPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const { apiOriginUrl } = getAppConfig();
  return <ProductEditForm apiOriginUrl={apiOriginUrl} productId={id} />;
}
