export interface CartImage {
  readonly url: string;
  readonly altText: string;
}

export interface CartItem {
  readonly id: string;
  readonly variantId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly price: number;
  readonly compareAtPrice: number | null;
  readonly quantity: number;
  readonly stock: number;
  readonly available: boolean;
  readonly image: CartImage | null;
}

export interface Cart {
  readonly items: readonly CartItem[];
}

const MAX_QUANTITY = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

function readText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") return null;
  return value;
}

function readWholeNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

function readNullablePrice(record: Record<string, unknown>, key: string): number | null | undefined {
  if (!(key in record) || record[key] === null) return null;
  const price = readWholeNumber(record, key);
  if (price === null) return undefined;
  return price;
}

function readHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return value;
  } catch {
    return null;
  }
}

function readImage(record: Record<string, unknown>): CartImage | null | undefined {
  if (!("image" in record) || record.image === null) return null;
  if (!isRecord(record.image)) return undefined;
  const url = readRequiredText(record.image, "url");
  const altText = readText(record.image, "altText");
  if (!url || altText === null) return undefined;
  const safeUrl = readHttpUrl(url);
  if (!safeUrl) return null;
  return { url: safeUrl, altText };
}

function readCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const variantId = readRequiredText(value, "variantId");
  const productSlug = readRequiredText(value, "productSlug");
  const productName = readRequiredText(value, "productName");
  const colorName = readRequiredText(value, "colorName");
  const colorHex = readRequiredText(value, "colorHex");
  const price = readWholeNumber(value, "price");
  const quantity = readWholeNumber(value, "quantity");
  const stock = readWholeNumber(value, "stock");
  const available = value.available;
  const compareAtPrice = readNullablePrice(value, "compareAtPrice");
  const image = readImage(value);
  if (!id || !variantId || !productSlug || !productName || !colorName || !colorHex) return null;
  if (price === null || quantity === null || stock === null || typeof available !== "boolean") return null;
  if (compareAtPrice === undefined || image === undefined) return null;
  if (price < 0 || quantity < 0 || stock < 0) return null;
  return {
    id,
    variantId,
    productSlug,
    productName,
    colorName,
    colorHex,
    price,
    compareAtPrice,
    quantity,
    stock,
    available,
    image,
  };
}

export function readCart(value: unknown): Cart | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items: CartItem[] = [];
  for (const item of value.items) {
    const line = readCartItem(item);
    if (!line) return null;
    items.push(line);
  }
  return { items };
}

export function lineTotal(item: CartItem): number {
  return item.price * item.quantity;
}

export function cartTotal(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function canIncreaseQuantity(item: CartItem): boolean {
  return item.available && item.quantity < item.stock && item.quantity < MAX_QUANTITY;
}
