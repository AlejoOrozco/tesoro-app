import type { CartItem } from "@/lib/cart";

export interface OrderItem {
  readonly id: string;
  readonly variantId: string;
  readonly productName: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

export interface Order {
  readonly id: string;
  readonly city: string;
  readonly addressLine: string;
  readonly orderStatus: string;
  readonly paymentStatus: string;
  readonly shippingStatus: string;
  readonly total: number;
  readonly holdExpiresAt: string;
  readonly placedAt: string;
  readonly items: readonly OrderItem[];
}

export const CITY_MAX_LENGTH = 80;
export const ADDRESS_MAX_LENGTH = 160;

const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

function readWholeNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return null;
  return value;
}

export function isOrderId(value: string): boolean {
  return ORDER_ID_PATTERN.test(value);
}

export function cartFingerprint(items: readonly CartItem[]): string {
  return items.map((item) => `${item.id}:${item.quantity}:${item.price}`).join("|");
}

export function deliveryError(city: string, addressLine: string): string | null {
  const trimmedCity = city.trim();
  const trimmedAddress = addressLine.trim();
  if (trimmedCity.length === 0) return "Escribe la ciudad.";
  if (trimmedCity.length > CITY_MAX_LENGTH) return "La ciudad puede tener hasta 80 caracteres.";
  if (trimmedAddress.length === 0) return "Escribe la dirección.";
  if (trimmedAddress.length > ADDRESS_MAX_LENGTH) return "La dirección puede tener hasta 160 caracteres.";
  return null;
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readOrderItem(value: unknown): OrderItem | null {
  if (!isRecord(value)) return null;
  const id = readRequiredText(value, "id");
  const variantId = readRequiredText(value, "variantId");
  const productName = readRequiredText(value, "productName");
  const colorName = readRequiredText(value, "colorName");
  const colorHex = readRequiredText(value, "colorHex");
  const quantity = readWholeNumber(value, "quantity");
  const unitPrice = readWholeNumber(value, "unitPrice");
  const subtotal = readWholeNumber(value, "subtotal");
  if (!id || !variantId || !productName || !colorName || !colorHex) return null;
  if (quantity === null || unitPrice === null || subtotal === null) return null;
  return { id, variantId, productName, colorName, colorHex, quantity, unitPrice, subtotal };
}

export function readOrder(value: unknown): Order | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const id = readRequiredText(value, "id");
  const city = readRequiredText(value, "city");
  const addressLine = readRequiredText(value, "addressLine");
  const orderStatus = readRequiredText(value, "orderStatus");
  const paymentStatus = readRequiredText(value, "paymentStatus");
  const shippingStatus = readRequiredText(value, "shippingStatus");
  const total = readWholeNumber(value, "total");
  const holdExpiresAt = readRequiredText(value, "holdExpiresAt");
  const placedAt = readRequiredText(value, "placedAt");
  if (!id || !city || !addressLine || !orderStatus || !paymentStatus || !shippingStatus) return null;
  if (total === null || !holdExpiresAt || !placedAt) return null;
  const items: OrderItem[] = [];
  for (const item of value.items) {
    const line = readOrderItem(item);
    if (!line) return null;
    items.push(line);
  }
  return { id, city, addressLine, orderStatus, paymentStatus, shippingStatus, total, holdExpiresAt, placedAt, items };
}

export function readOrderList(value: unknown): readonly Order[] | null {
  if (!Array.isArray(value)) return null;
  const orders: Order[] = [];
  for (const item of value) {
    const order = readOrder(item);
    if (!order) return null;
    orders.push(order);
  }
  return orders;
}
