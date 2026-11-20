"use client";

import { ProductFields } from "@/app/admin/product-fields";
import { createProduct, listCategories } from "@/lib/admin-api";
import type { Category } from "@/lib/catalog";
import { VariantFields } from "@/app/admin/variant-fields";
import { emptyProductDraft, emptyVariantDraft, toProductWrite, type ProductDraft, type VariantDraft } from "@/lib/product-draft";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

interface ProductCreateFormProps {
  readonly apiOriginUrl: string;
}

export function ProductCreateForm({ apiOriginUrl }: ProductCreateFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);
  const [variant, setVariant] = useState<VariantDraft>(emptyVariantDraft(true));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void listCategories(apiOriginUrl).then((result) => {
      if (result.ok) setCategories(result.data);
      else setErrorMessage(result.message);
    });
  }, [apiOriginUrl]);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = toProductWrite(draft, [variant]);
    if (!parsed.ok) {
      setErrorMessage(parsed.message);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    const result = await createProduct(apiOriginUrl, parsed.product);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    router.push(`/admin/products/${result.data.id}`);
  }

  return (
    <form className="panel stack" onSubmit={handleCreate}>
      <div className="panel-head">
        <h2>Nuevo producto</h2>
        <Link className="button secondary" href="/admin/products">Volver</Link>
      </div>
      <ProductFields draft={draft} categories={categories} onChange={setDraft} />
      <h2>Color</h2>
      <VariantFields draft={variant} onChange={setVariant} showDefault={false} />
      <p className="hint">Las fotos se agregan después de crear el producto.</p>
      {errorMessage ? <p className="alert" role="alert">{errorMessage}</p> : null}
      <button type="submit" disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? "Creando…" : "Crear producto"}
      </button>
    </form>
  );
}

