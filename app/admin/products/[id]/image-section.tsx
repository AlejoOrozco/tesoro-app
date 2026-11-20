"use client";

import { EmptyState } from "@/app/admin/empty-state";
import { Field, FIELD_HELP } from "@/app/admin/field-help";
import { HoldButton } from "@/app/admin/hold-button";
import { createImage, deleteImage } from "@/lib/admin-api";
import type { ProductImage, ProductVariant } from "@/lib/catalog";
import { type FormEvent, useState } from "react";

interface ImageSectionProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

export function ImageSection({
  apiOriginUrl,
  productId,
  images,
  variants,
  onChanged,
  onError,
}: ImageSectionProps) {
  return (
    <section className="stack">
      <h2>Fotos</h2>
      <p className="hint">La foto con el orden más bajo es la de la tienda. Sin color, se muestra en todos.</p>
      {images.length === 0 ? <EmptyState message="Este producto todavía no tiene fotos." /> : null}
      {images.map((image) => (
        <ImageRow
          key={image.id}
          apiOriginUrl={apiOriginUrl}
          productId={productId}
          image={image}
          onChanged={onChanged}
          onError={onError}
        />
      ))}
      <ImageCreate
        apiOriginUrl={apiOriginUrl}
        productId={productId}
        variants={variants}
        nextOrder={nextSortOrder(images)}
        onChanged={onChanged}
        onError={onError}
      />
    </section>
  );
}

function nextSortOrder(images: readonly ProductImage[]): number {
  const orders = images.map((image) => image.sortOrder);
  if (orders.length === 0) return 0;
  return Math.max(...orders) + 1;
}

interface ImageRowProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly image: ProductImage;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function ImageRow({ apiOriginUrl, productId, image, onChanged, onError }: ImageRowProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleDelete(): Promise<void> {
    setIsSaving(true);
    onError(null);
    const result = await deleteImage(apiOriginUrl, productId, image.id);
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    await onChanged();
  }

  return (
    <article className="photo">
      <img src={image.url} alt={image.altText} />
      <div className="item-row">
        <div>
          <strong>{image.altText}</strong>
          <p className="hint">Orden {image.sortOrder}</p>
        </div>
        <HoldButton doneLabel="Foto quitada" disabled={isSaving} onHold={() => void handleDelete()}>
          Mantén para quitar
        </HoldButton>
      </div>
    </article>
  );
}

interface ImageCreateProps {
  readonly apiOriginUrl: string;
  readonly productId: string;
  readonly variants: readonly ProductVariant[];
  readonly nextOrder: number;
  readonly onChanged: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function ImageCreate({ apiOriginUrl, productId, variants, nextOrder, onChanged, onError }: ImageCreateProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const variantId = String(formData.get("variantId") ?? "");
    const sortOrder = Number(formData.get("sortOrder"));
    if (!Number.isInteger(sortOrder)) {
      onError("El orden debe ser un número entero.");
      return;
    }
    setIsSaving(true);
    onError(null);
    const result = await createImage(apiOriginUrl, productId, {
      url: String(formData.get("url") ?? ""),
      altText: String(formData.get("altText") ?? ""),
      sortOrder,
      variantId: variantId.length === 0 ? null : variantId,
    });
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    form.reset();
    await onChanged();
  }

  return (
    <form className="stack" onSubmit={handleCreate}>
      <Field label="URL de la foto" help={FIELD_HELP.imageUrl}>
        {(fieldId) => <input id={fieldId} name="url" type="url" required />}
      </Field>
      <Field label="Texto alternativo" help={FIELD_HELP.altText}>
        {(fieldId) => <input id={fieldId} name="altText" required />}
      </Field>
      <Field label="Orden" help={FIELD_HELP.sortOrder}>
        {(fieldId) => <input id={fieldId} name="sortOrder" inputMode="numeric" defaultValue={nextOrder} required />}
      </Field>
      <Field label="Color" help={FIELD_HELP.imageColor}>
        {(fieldId) => (
          <select id={fieldId} name="variantId" defaultValue="">
            <option value="">Todos los colores</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.colorName}
              </option>
            ))}
          </select>
        )}
      </Field>
      <button type="submit" disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? "Agregando…" : "Agregar foto"}
      </button>
    </form>
  );
}
