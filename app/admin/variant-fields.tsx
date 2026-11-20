"use client";

import { CheckField, Field, FIELD_HELP } from "@/app/admin/field-help";
import type { VariantDraft } from "@/lib/product-draft";

interface VariantFieldsProps {
  readonly draft: VariantDraft;
  readonly onChange: (draft: VariantDraft) => void;
  readonly showDefault: boolean;
}

export function VariantFields({ draft, onChange, showDefault }: VariantFieldsProps) {
  function update(patch: Partial<VariantDraft>): void {
    onChange({ ...draft, ...patch });
  }

  return (
    <>
      <Field label="Nombre del color" help={FIELD_HELP.colorName}>
        {(fieldId) => (
          <input
            id={fieldId}
            value={draft.colorName}
            onChange={(event) => update({ colorName: event.target.value })}
            required
          />
        )}
      </Field>
      <Field label="Color" help={FIELD_HELP.color} plain>
        {(fieldId) => (
          <input
            id={fieldId}
            type="color"
            value={safeHex(draft.colorHex)}
            onChange={(event) => update({ colorHex: event.target.value })}
          />
        )}
      </Field>
      <Field label="Precio (pesos)" help={FIELD_HELP.price}>
        {(fieldId) => (
          <input
            id={fieldId}
            inputMode="numeric"
            value={draft.price}
            onChange={(event) => update({ price: event.target.value })}
            required
          />
        )}
      </Field>
      <Field label="Precio de comparación" help={FIELD_HELP.compareAtPrice}>
        {(fieldId) => (
          <input
            id={fieldId}
            inputMode="numeric"
            value={draft.compareAtPrice}
            onChange={(event) => update({ compareAtPrice: event.target.value })}
          />
        )}
      </Field>
      <Field label="Inventario" help={FIELD_HELP.stock}>
        {(fieldId) => (
          <input
            id={fieldId}
            inputMode="numeric"
            value={draft.stock}
            onChange={(event) => update({ stock: event.target.value })}
            required
          />
        )}
      </Field>
      <Field label="Código de barras" help={FIELD_HELP.barcode}>
        {(fieldId) => (
          <input
            id={fieldId}
            value={draft.barcode}
            onChange={(event) => update({ barcode: event.target.value })}
          />
        )}
      </Field>
      {showDefault ? (
        <CheckField
          label="Color predeterminado"
          help={FIELD_HELP.defaultColor}
          checked={draft.isDefault}
          onChange={(isDefault) => update({ isDefault })}
        />
      ) : null}
    </>
  );
}

function safeHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return "#000000";
}
