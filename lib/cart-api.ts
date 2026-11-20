import { readCart, type Cart } from "@/lib/cart";

export type CartResult =
  | { readonly ok: true; readonly cart: Cart }
  | { readonly ok: false; readonly status: number; readonly message: string };

interface CartHttp {
  readonly status: number;
  readonly body: unknown;
}

const SERVER_UNREACHABLE_MESSAGE = "No se pudo conectar con el servidor.";
const REQUEST_FAILED_MESSAGE = "No se pudo completar la solicitud.";

const VISITOR_MESSAGES: Record<string, string> = {
  "Not enough stock": "No hay suficiente stock.",
  "This product is not available": "Este producto no está disponible.",
  "Color not found": "No encontramos ese color.",
  "Cart not found": "No encontramos el carrito.",
  "Item not found": "No encontramos ese producto en el carrito.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const message = value.message;
  if (typeof message !== "string" || message.length === 0) return null;
  return VISITOR_MESSAGES[message] ?? message;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return null;
  }
}

async function send(apiOriginUrl: string, path: string, init: RequestInit): Promise<CartHttp> {
  try {
    const response = await fetch(`${apiOriginUrl}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
    });
    return { status: response.status, body: await readBody(response) };
  } catch {
    return { status: 0, body: null };
  }
}

function fromResponse(result: CartHttp): CartResult {
  if (result.status === 0) return { ok: false, status: 0, message: SERVER_UNREACHABLE_MESSAGE };
  const cart = readCart(result.body);
  if (result.status === 200 && cart) return { ok: true, cart };
  return { ok: false, status: result.status, message: readErrorMessage(result.body) ?? REQUEST_FAILED_MESSAGE };
}

export async function getCart(apiOriginUrl: string): Promise<CartResult> {
  return fromResponse(await send(apiOriginUrl, "/cart", { method: "GET" }));
}

export async function setCartItemQuantity(
  apiOriginUrl: string,
  itemId: string,
  quantity: number,
): Promise<CartResult> {
  return fromResponse(
    await send(apiOriginUrl, `/cart/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    }),
  );
}

export async function removeCartItem(apiOriginUrl: string, itemId: string): Promise<CartResult> {
  return fromResponse(
    await send(apiOriginUrl, `/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  );
}
