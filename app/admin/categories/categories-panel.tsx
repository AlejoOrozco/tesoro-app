"use client";

import { listCategories } from "@/lib/admin-api";
import type { Category } from "@/lib/catalog";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { CategoryList } from "../category-list";
import { EmptyState, PanelSkeleton } from "../empty-state";

interface CategoriesPanelProps {
  readonly apiOriginUrl: string;
}

export function CategoriesPanel({ apiOriginUrl }: CategoriesPanelProps): ReactElement {
  const router = useRouter();
  const [categories, setCategories] = useState<readonly Category[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCategories = useCallback(async (): Promise<void> => {
    const result = await listCategories(apiOriginUrl);
    if (!result.ok) {
      if (result.status === 401) router.replace("/login");
      setErrorMessage(result.message);
      return;
    }
    setCategories(result.data);
    setErrorMessage(null);
  }, [apiOriginUrl, router]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  if (!categories) {
    if (errorMessage) {
      return (
        <EmptyState
          message={errorMessage}
          action={<button type="button" onClick={() => void loadCategories()}>Reintentar</button>}
        />
      );
    }
    return <PanelSkeleton />;
  }

  return (
    <CategoryList apiOriginUrl={apiOriginUrl} categories={categories} onChange={loadCategories} />
  );
}
