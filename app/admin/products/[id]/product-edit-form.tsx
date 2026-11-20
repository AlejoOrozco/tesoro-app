"use client";

import { EmptyState, PanelSkeleton } from "@/app/admin/empty-state";
import { HoldButton } from "@/app/admin/hold-button";
import { ProductFields } from "@/app/admin/product-fields";
import { deleteProduct, getAdminProduct, listCategories, updateProduct } from "@/lib/admin-api";
import type { AdminProduct, Category } from "@/lib/catalog";
import { draftFromProduct, toProductWrite, type ProductDraft } from "@/lib/product-draft";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ImageSection } from "./image-section";
import { VariantSection } from "./variant-section";

interface ProductEditFormProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
}

export function ProductEditForm({ apiOriginUrl, productId }: ProductEditFormProps) {
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadProduct = useCallback(async (): Promise<void> => {
    const [productResult, categoryResult] = await Promise.all([
      getAdminProduct(apiOriginUrl, productId),
      listCategories(apiOriginUrl),
    ]);
    if (!productResult.ok) {
      if (productResult.status === 401) router.replace("/login");
      setErrorMessage(productResult.message);
      return;
    }
    if (!categoryResult.ok) {
      setErrorMessage(categoryResult.message);
      return;
    }
    setProduct(productResult.data);
    setDraft(draftFromProduct(productResult.data));
    setCategories(categoryResult.data);
    setErrorMessage(null);
  }, [apiOriginUrl, productId, router]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!draft) return;
    const parsed = toProductWrite(draft, null);
    if (!parsed.ok) {
      setErrorMessage(parsed.message);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    const result = await updateProduct(apiOriginUrl, productId, parsed.product);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setProduct(result.data);
    setDraft(draftFromProduct(result.data));
  }

  async function handleDelete(): Promise<void> {
    setIsSaving(true);
    const result = await deleteProduct(apiOriginUrl, productId);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    router.push("/admin/products");
  }

  if (!product || !draft) {
    if (errorMessage) {
      return (
        <EmptyState
          message={errorMessage}
          action={<button type="button" onClick={() => void loadProduct()}>Reintentar</button>}
        />
      );
    }
    return <PanelSkeleton />;
  }

  return (
    <div className="stack">
      <div className="panel-head">
        <h2>{product.name}</h2>
        <Link className="button secondary" href="/admin/products">Volver</Link>
      </div>
      <form className="panel stack" onSubmit={handleSave}>
        <ProductFields draft={draft} categories={categories} onChange={setDraft} />
        {errorMessage ? <p className="alert" role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? "Guardando…" : "Guardar producto"}
        </button>
      </form>
      <section className="panel">
        <VariantSection
          apiOriginUrl={apiOriginUrl}
          productId={productId}
          variants={product.variants}
          onChanged={loadProduct}
          onError={setErrorMessage}
        />
      </section>
      <section className="panel">
        <ImageSection
          apiOriginUrl={apiOriginUrl}
          productId={productId}
          images={product.images}
          variants={product.variants}
          onChanged={loadProduct}
          onError={setErrorMessage}
        />
      </section>
      <section className="danger-zone">
        <h2>Zona de riesgo</h2>
        <p className="hint">Eliminar este producto también quita sus colores y fotos.</p>
        <HoldButton doneLabel="Producto eliminado" disabled={isSaving} onHold={() => void handleDelete()}>
          Mantén para eliminar
        </HoldButton>
      </section>
    </div>
  );
}
