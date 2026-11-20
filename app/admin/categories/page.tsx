import { getAppConfig } from "@/lib/app-config";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CategoriesPanel } from "./categories-panel";

export const metadata: Metadata = {
  title: "Categorías",
};

export default function CategoriesPage(): ReactElement {
  const { apiOriginUrl } = getAppConfig();
  return <CategoriesPanel apiOriginUrl={apiOriginUrl} />;
}
