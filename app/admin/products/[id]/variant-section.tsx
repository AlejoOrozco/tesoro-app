"use client";

import { createVariant, deleteVariant, updateVariant } from "@/lib/admin-api";
import type { ProductVariant } from "@/lib/catalog";
import { HoldButton } from "@/app/admin/hold-button";
import { VariantFields } from "@/app/admin/variant-fields";
import { draftFromVariant, emptyVariantDraft, toVariantWrite, type VariantDraft } from "@/lib/product-draft";
import { type FormEvent, useEffect, useState } from "react";

interface VariantSectionProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly variants: readonly ProductVariant[];
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

export function VariantSection({
  apiOriginUrl,
  productId,
  variants,
  onChanged,
  onError,
}: VariantSectionProps) {
  return (
    <section className="stack">
      <h2>Colores</h2>
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          apiOriginUrl={apiOriginUrl}
          productId={productId}
          variant={variant}
          onChanged={onChanged}
          onError={onError}
        />
      ))}
      <NewVariant
        apiOriginUrl={apiOriginUrl}
        productId={productId}
        isFirst={variants.length === 0}
        onChanged={onChanged}
        onError={onError}
      />
    </section>
  );
}

interface VariantRowProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly variant: ProductVariant;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function VariantRow({ apiOriginUrl, productId, variant, onChanged, onError }: VariantRowProps) {
  const [draft, setDraft] = useState<VariantDraft>(draftFromVariant(variant));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(draftFromVariant(variant));
  }, [variant]);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = toVariantWrite(draft);
    if (!parsed.ok) {
      onError(parsed.message);
      return;
    }
    setIsSaving(true);
    onError(null);
    const result = await updateVariant(apiOriginUrl, productId, variant.id, parsed.variant);
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    await onChanged();
  }

  async function handleDelete(): Promise<void> {
    setIsSaving(true);
    onError(null);
    const result = await deleteVariant(apiOriginUrl, productId, variant.id);
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    await onChanged();
  }

  return (
    <form className="item stack" onSubmit={handleSave}>
      <VariantFields draft={draft} onChange={setDraft} showDefault />
      <div className="actions">
        <button type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? "Guardando…" : "Guardar color"}
        </button>
        <HoldButton doneLabel="Color quitado" disabled={isSaving} onHold={() => void handleDelete()}>
          Mantén para quitar
        </HoldButton>
      </div>
    </form>
  );
}

interface NewVariantProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly isFirst: boolean;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function NewVariant({ apiOriginUrl, productId, isFirst, onChanged, onError }: NewVariantProps) {
  const [draft, setDraft] = useState<VariantDraft>(emptyVariantDraft(isFirst));
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = toVariantWrite(draft);
    if (!parsed.ok) {
      onError(parsed.message);
      return;
    }
    setIsSaving(true);
    onError(null);
    const result = await createVariant(apiOriginUrl, productId, parsed.variant);
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    setDraft(emptyVariantDraft(false));
    await onChanged();
  }

  return (
    <form className="stack" onSubmit={handleCreate}>
      <h2>Agregar color</h2>
      <VariantFields draft={draft} onChange={setDraft} showDefault />
      <button type="submit" disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? "Agregando…" : "Agregar color"}
      </button>
    </form>
  );
}
