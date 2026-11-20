import type {
  AdminProduct,
  Category,
  ProductImage,
  ProductVariant,
} from "@/lib/catalog";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") return null;
  return value;
}

function readRequiredText(record: Record<string, unknown>, key: string): string | null {
  const value = readText(record, key);
  if (value === null || value.length === 0) return null;
  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  if (typeof value !== "boolean") return null;
  return value;
}

function readNullableNumber(record: Record<string, unknown>, key: string): number | null | undefined {
  if (!(key in record) || record[key] === null) return null;
  return readNumber(record, key) ?? undefined;
}

function readNullableText(record: Record<string, unknown>, key: string): string | null | undefined {
  if (!(key in record) || record[key] === null) return null;
  return readText(record, key) ?? undefined;
}

export function readCategory(value: unknown): Category | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const name = readRequiredText(value, "name");
  const slug = readRequiredText(value, "slug");
  if (!id || !name || !slug) return null;
  return { id, name, slug };
}

export function readCategoryList(value: unknown): readonly Category[] | null {
  if (!Array.isArray(value)) return null;
  const categories: Category[] = [];
  for (const item of value) {
    const category = readCategory(item);
    if (!category) return null;
    categories.push(category);
  }
  return categories;
}

function readVariant(value: unknown): ProductVariant | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const colorName = readRequiredText(value, "colorName");
  const colorHex = readRequiredText(value, "colorHex");
  const price = readNumber(value, "price");
  const stock = readNumber(value, "stock");
  const isDefault = readBoolean(value, "isDefault");
  const compareAtPrice = readNullableNumber(value, "compareAtPrice");
  const barcode = readNullableText(value, "barcode");
  if (!id || !colorName || !colorHex || price === null || stock === null || isDefault === null) {
    return null;
  }
  if (compareAtPrice === undefined || barcode === undefined) return null;
  return { id, colorName, colorHex, price, compareAtPrice, stock, barcode, isDefault };
}

function readProductImage(value: unknown): ProductImage | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const url = readRequiredText(value, "url");
  const altText = readText(value, "altText");
  const sortOrder = readNumber(value, "sortOrder");
  const variantId = readNullableText(value, "variantId");
  if (!id || !url || altText === null || sortOrder === null || variantId === undefined) return null;
  return { id, url, altText, sortOrder, variantId };
}

function readList<T>(value: unknown, readItem: (item: unknown) => T | null): readonly T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  for (const item of value) {
    const parsed = readItem(item);
    if (!parsed) return null;
    items.push(parsed);
  }
  return items;
}

export function readAdminProduct(value: unknown): AdminProduct | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const slug = readRequiredText(value, "slug");
  const name = readRequiredText(value, "name");
  const category = readCategory(value.category);
  const isFeatured = readBoolean(value, "isFeatured");
  const isActive = readBoolean(value, "isActive");
  const variants = readList(value.variants, readVariant);
  const images = readList(value.images, readProductImage);
  const details = readProductDetails(value);
  if (!id || !slug || !name || !category || isFeatured === null || isActive === null || !variants || !images) {
    return null;
  }
  if (!details) return null;
  return { id, slug, name, category, isFeatured, isActive, variants, images, ...details };
}

function readProductDetails(value: Record<string, unknown>): Pick<
  AdminProduct,
  | "shortDescription"
  | "description"
  | "brand"
  | "weightGrams"
  | "lengthCm"
  | "widthCm"
  | "heightCm"
  | "warrantyMonths"
> | null {
  const shortDescription = readNullableText(value, "shortDescription");
  const description = readNullableText(value, "description");
  const brand = readNullableText(value, "brand");
  const weightGrams = readNullableNumber(value, "weightGrams");
  const lengthCm = readNullableNumber(value, "lengthCm");
  const widthCm = readNullableNumber(value, "widthCm");
  const heightCm = readNullableNumber(value, "heightCm");
  const warrantyMonths = readNullableNumber(value, "warrantyMonths");
  if (
    shortDescription === undefined ||
    description === undefined ||
    brand === undefined ||
    weightGrams === undefined ||
    lengthCm === undefined ||
    widthCm === undefined ||
    heightCm === undefined ||
    warrantyMonths === undefined
  ) {
    return null;
  }
  return { shortDescription, description, brand, weightGrams, lengthCm, widthCm, heightCm, warrantyMonths };
}

export function readAdminProductList(value: unknown): readonly AdminProduct[] | null {
  return readList(value, readAdminProduct);
}
