import type { AdminProduct, ProductVariant, ProductWrite, VariantWrite } from "@/lib/catalog";

export interface VariantDraft {
  readonly colorName: string;
  readonly colorHex: string;
  readonly price: string;
  readonly compareAtPrice: string;
  readonly stock: string;
  readonly barcode: string;
  readonly isDefault: boolean;
}

export interface ProductDraft {
  readonly name: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly brand: string;
  readonly weightGrams: string;
  readonly lengthCm: string;
  readonly widthCm: string;
  readonly heightCm: string;
  readonly warrantyMonths: string;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
}

export type DraftResult =
  | { readonly ok: true; readonly product: ProductWrite }
  | { readonly ok: false; readonly message: string };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function emptyVariantDraft(isDefault: boolean): VariantDraft {
  return {
    colorName: "",
    colorHex: "#000000",
    price: "",
    compareAtPrice: "",
    stock: "0",
    barcode: "",
    isDefault,
  };
}

export function draftFromProduct(product: AdminProduct): ProductDraft {
  return {
    name: product.name,
    slug: product.slug,
    categoryId: product.category.id,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    brand: product.brand ?? "",
    weightGrams: optionalNumberText(product.weightGrams),
    lengthCm: optionalNumberText(product.lengthCm),
    widthCm: optionalNumberText(product.widthCm),
    heightCm: optionalNumberText(product.heightCm),
    warrantyMonths: optionalNumberText(product.warrantyMonths),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };
}

export function draftFromVariant(variant: ProductVariant): VariantDraft {
  return {
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice === null ? "" : String(variant.compareAtPrice),
    stock: String(variant.stock),
    barcode: variant.barcode ?? "",
    isDefault: variant.isDefault,
  };
}

export function emptyProductDraft(): ProductDraft {
  return {
    name: "",
    slug: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    brand: "",
    weightGrams: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    warrantyMonths: "",
    isActive: true,
    isFeatured: false,
  };
}

function optionalNumberText(value: number | null): string {
  if (value === null) return "";
  return String(value);
}

function readWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value);
}

function readOptionalWholeNumber(value: string): number | null | undefined {
  if (value.trim().length === 0) return null;
  return readWholeNumber(value) ?? undefined;
}

function readVariantWrite(draft: VariantDraft): VariantWrite | null {
  const price = readWholeNumber(draft.price);
  const stock = readWholeNumber(draft.stock);
  if (price === null || stock === null || draft.colorName.trim().length === 0) return null;
  if (!COLOR_HEX_PATTERN.test(draft.colorHex)) return null;
  const variant: VariantWrite = {
    colorName: draft.colorName.trim(),
    colorHex: draft.colorHex,
    price,
    stock,
    barcode: draft.barcode.trim().length === 0 ? null : draft.barcode.trim(),
    isDefault: draft.isDefault,
  };
  if (draft.compareAtPrice.trim().length === 0) return variant;
  const compareAtPrice = readWholeNumber(draft.compareAtPrice);
  if (compareAtPrice === null || compareAtPrice <= price) return null;
  return { ...variant, compareAtPrice };
}

function readProductNumbers(draft: ProductDraft): Pick<
  ProductWrite,
  "weightGrams" | "lengthCm" | "widthCm" | "heightCm" | "warrantyMonths"
> | null {
  const weightGrams = readOptionalWholeNumber(draft.weightGrams);
  const lengthCm = readOptionalWholeNumber(draft.lengthCm);
  const widthCm = readOptionalWholeNumber(draft.widthCm);
  const heightCm = readOptionalWholeNumber(draft.heightCm);
  const warrantyMonths = readOptionalWholeNumber(draft.warrantyMonths);
  if (
    weightGrams === undefined ||
    lengthCm === undefined ||
    widthCm === undefined ||
    heightCm === undefined ||
    warrantyMonths === undefined
  ) {
    return null;
  }
  return { weightGrams, lengthCm, widthCm, heightCm, warrantyMonths };
}

export function toProductWrite(
  draft: ProductDraft,
  variants: readonly VariantDraft[] | null,
): DraftResult {
  if (!SLUG_PATTERN.test(draft.slug.trim())) {
    return { ok: false, message: "El slug solo puede tener minúsculas, números y guiones." };
  }
  if (draft.categoryId.length === 0 || draft.name.trim().length === 0) {
    return { ok: false, message: "El nombre y la categoría son obligatorios." };
  }
  const numbers = readProductNumbers(draft);
  if (!numbers) return { ok: false, message: "Revisa las medidas y la garantía. Deben ser números enteros." };
  const product: ProductWrite = {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    categoryId: draft.categoryId,
    shortDescription: draft.shortDescription.trim(),
    description: draft.description.trim(),
    brand: draft.brand.trim(),
    ...numbers,
    isActive: draft.isActive,
    isFeatured: draft.isFeatured,
  };
  if (!variants) return { ok: true, product };
  return withVariants(product, variants);
}

function withVariants(product: ProductWrite, drafts: readonly VariantDraft[]): DraftResult {
  if (drafts.length === 0) return { ok: false, message: "Agrega al menos un color." };
  const defaults = drafts.filter((draft) => draft.isDefault);
  if (defaults.length !== 1) return { ok: false, message: "Elige un solo color predeterminado." };
  const names = new Set(drafts.map((draft) => draft.colorName.trim().toLowerCase()));
  if (names.size !== drafts.length) {
    return { ok: false, message: "Cada color debe tener un nombre distinto." };
  }
  const variants: VariantWrite[] = [];
  for (const draft of drafts) {
    const variant = readVariantWrite(draft);
    if (!variant) {
      return { ok: false, message: "Revisa el color, el precio y el inventario." };
    }
    variants.push(variant);
  }
  return { ok: true, product: { ...product, variants } };
}

export type VariantDraftResult =
  | { readonly ok: true; readonly variant: VariantWrite }
  | { readonly ok: false; readonly message: string };

export function toVariantWrite(draft: VariantDraft): VariantDraftResult {
  const variant = readVariantWrite(draft);
  if (!variant) return { ok: false, message: "Revisa el color, el precio y el inventario." };
  return { ok: true, variant };
}
