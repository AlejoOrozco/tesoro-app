"use client";

import { CheckField, Field, FIELD_HELP } from "@/app/admin/field-help";
import type { Category } from "@/lib/catalog";
import type { ProductDraft } from "@/lib/product-draft";

interface ProductFieldsProps {
  readonly draft: ProductDraft;
  readonly categories: readonly Category[];
  readonly onChange: (draft: ProductDraft) => void;
}

export function ProductFields({ draft, categories, onChange }: ProductFieldsProps) {
  function update(patch: Partial<ProductDraft>): void {
    onChange({ ...draft, ...patch });
  }

  return (
    <div className="stack">
      <Field label="Nombre" help={FIELD_HELP.productName}>
        {(fieldId) => (
          <input
            id={fieldId}
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
            required
          />
        )}
      </Field>
      <Field label="Slug" help={FIELD_HELP.slug}>
        {(fieldId) => (
          <input
            id={fieldId}
            value={draft.slug}
            onChange={(event) => update({ slug: event.target.value })}
            required
          />
        )}
      </Field>
      <Field label="Categoría" help={FIELD_HELP.category}>
        {(fieldId) => (
          <select
            id={fieldId}
            value={draft.categoryId}
            onChange={(event) => update({ categoryId: event.target.value })}
            required
          >
            <option value="">Elige una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Descripción corta" help={FIELD_HELP.shortDescription}>
        {(fieldId) => (
          <input
            id={fieldId}
            value={draft.shortDescription}
            onChange={(event) => update({ shortDescription: event.target.value })}
          />
        )}
      </Field>
      <Field label="Descripción" help={FIELD_HELP.description}>
        {(fieldId) => (
          <textarea
            id={fieldId}
            value={draft.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        )}
      </Field>
      <Field label="Marca" help={FIELD_HELP.brand}>
        {(fieldId) => (
          <input id={fieldId} value={draft.brand} onChange={(event) => update({ brand: event.target.value })} />
        )}
      </Field>
      <NumberField label="Peso (g)" help={FIELD_HELP.weight} value={draft.weightGrams} onChange={(weightGrams) => update({ weightGrams })} />
      <NumberField label="Largo (cm)" help={FIELD_HELP.length} value={draft.lengthCm} onChange={(lengthCm) => update({ lengthCm })} />
      <NumberField label="Ancho (cm)" help={FIELD_HELP.width} value={draft.widthCm} onChange={(widthCm) => update({ widthCm })} />
      <NumberField label="Alto (cm)" help={FIELD_HELP.height} value={draft.heightCm} onChange={(heightCm) => update({ heightCm })} />
      <NumberField
        label="Garantía (meses)"
        help={FIELD_HELP.warranty}
        value={draft.warrantyMonths}
        onChange={(warrantyMonths) => update({ warrantyMonths })}
      />
      <CheckField
        label="Visible en la tienda"
        help={FIELD_HELP.visible}
        checked={draft.isActive}
        onChange={(isActive) => update({ isActive })}
      />
      <CheckField
        label="Destacado"
        help={FIELD_HELP.featured}
        checked={draft.isFeatured}
        onChange={(isFeatured) => update({ isFeatured })}
      />
    </div>
  );
}

interface NumberFieldProps {
  readonly label: string;
  readonly help: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function NumberField({ label, help, value, onChange }: NumberFieldProps) {
  return (
    <Field label={label} help={help}>
      {(fieldId) => (
        <input id={fieldId} inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
}
