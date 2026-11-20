"use client";

import { listAdminProducts } from "@/lib/admin-api";
import type { AdminProduct } from "@/lib/catalog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { EmptyState, PanelSkeleton } from "../empty-state";
import { ProductList } from "../product-list";

interface ProductsPanelProps {
  readonly apiOriginUrl: string;
}

export function ProductsPanel({ apiOriginUrl }: ProductsPanelProps): ReactElement {
  const router = useRouter();
  const [products, setProducts] = useState<readonly AdminProduct[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async (): Promise<void> => {
    const result = await listAdminProducts(apiOriginUrl);
    if (!result.ok) {
      if (result.status === 401) router.replace("/login");
      setErrorMessage(result.message);
      return;
    }
    setProducts(result.data);
    setErrorMessage(null);
  }, [apiOriginUrl, router]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (!products) {
    if (errorMessage) {
      return (
        <EmptyState
          message={errorMessage}
          action={<button type="button" onClick={() => void loadProducts()}>Reintentar</button>}
        />
      );
    }
    return <PanelSkeleton />;
  }

  return <ProductList products={products} />;
}
