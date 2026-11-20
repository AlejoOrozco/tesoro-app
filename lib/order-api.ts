import { getMe } from "@/lib/auth-api";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf-token";
import { readOrder, readOrderList, type Order } from "@/lib/order";

export type OrderFailureCode =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "empty"
  | "stock"
  | "unavailable"
  | "color"
  | "idempotency"
  | "missing"
  | "csrf"
  | "other";

export type OrderResult =
  | { readonly ok: true; readonly order: Order }
  | { readonly ok: false; readonly status: number; readonly code: OrderFailureCode; readonly message: string };

export type OrderListResult =
  | { readonly ok: true; readonly orders: readonly Order[] }
  | { readonly ok: false; readonly status: number; readonly code: OrderFailureCode; readonly message: string };

export interface PlaceOrderInput {
  readonly city: string;
  readonly addressLine: string;
  readonly idempotencyKey: string;
}

interface OrderHttp {
  readonly status: number;
  readonly body: unknown;
}

const SERVER_UNREACHABLE_MESSAGE = "No se pudo conectar con el servidor.";
const REQUEST_FAILED_MESSAGE = "No se pudo completar la solicitud.";
const UNAUTHORIZED_MESSAGE = "Inicia sesión para continuar.";
const FORBIDDEN_MESSAGE = "No tienes acceso a los pedidos.";
const MISSING_MESSAGE = "No encontramos este pedido.";

const VISITOR_MESSAGES: Record<string, { readonly code: OrderFailureCode; readonly message: string }> = {
  "Cart is empty": { code: "empty", message: "El carrito está vacío." },
  "Not enough stock": {
    code: "stock",
    message: "No hay suficientes unidades libres. Baja la cantidad en el carrito.",
  },
  "This product is not available": {
    code: "unavailable",
    message: "Este producto está oculto. Quítalo del carrito.",
  },
  "Color not found": { code: "color", message: "Ese color ya no existe. Quítalo del carrito." },
  "Idempotency key is required": { code: "idempotency", message: "No se pudo enviar el pedido. Inténtalo de nuevo." },
  "Idempotency key is invalid": { code: "idempotency", message: "No se pudo enviar el pedido. Inténtalo de nuevo." },
  "Order not found": { code: "missing", message: MISSING_MESSAGE },
  Forbidden: { code: "forbidden", message: FORBIDDEN_MESSAGE },
  "Order total is invalid": { code: "other", message: "No se pudo calcular el total del pedido." },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRawMessage(value: unknown): string | null {
  if (!isRecord(value) || typeof value.message !== "string" || value.message.length === 0) return null;
  return value.message;
}

function failure(status: number, raw: string | null): Extract<OrderResult, { ok: false }> {
  if (status === 0) return { ok: false, status, code: "network", message: SERVER_UNREACHABLE_MESSAGE };
  if (status === 401) return { ok: false, status, code: "unauthorized", message: UNAUTHORIZED_MESSAGE };
  if (status === 404) return { ok: false, status, code: "missing", message: MISSING_MESSAGE };
  const known = raw ? VISITOR_MESSAGES[raw] : undefined;
  if (known) return { ok: false, status, code: known.code, message: known.message };
  if (status === 403) return { ok: false, status, code: "forbidden", message: FORBIDDEN_MESSAGE };
  return { ok: false, status, code: "other", message: REQUEST_FAILED_MESSAGE };
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

async function send(apiOriginUrl: string, path: string, init: RequestInit): Promise<OrderHttp> {
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

function orderFrom(result: OrderHttp): OrderResult {
  const raw = readRawMessage(result.body);
  const order = readOrder(result.body);
  if ((result.status === 200 || result.status === 201) && order) return { ok: true, order };
  if (raw === "Invalid CSRF token") return { ok: false, status: result.status, code: "csrf", message: REQUEST_FAILED_MESSAGE };
  return failure(result.status, raw);
}

async function postOrder(apiOriginUrl: string, input: PlaceOrderInput, csrfToken: string): Promise<OrderResult> {
  return orderFrom(
    await send(apiOriginUrl, "/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({ city: input.city, addressLine: input.addressLine }),
    }),
  );
}

async function refreshAndPlace(apiOriginUrl: string, input: PlaceOrderInput): Promise<OrderResult> {
  const session = await getMe(apiOriginUrl);
  if (!session.ok) return failure(session.status, null);
  setCsrfToken(session.session.csrfToken);
  const second = await postOrder(apiOriginUrl, input, session.session.csrfToken);
  if (!second.ok && second.code === "csrf") return failure(second.status, null);
  return second;
}

export async function placeOrder(apiOriginUrl: string, input: PlaceOrderInput): Promise<OrderResult> {
  const csrfToken = getCsrfToken();
  if (!csrfToken) return refreshAndPlace(apiOriginUrl, input);
  const first = await postOrder(apiOriginUrl, input, csrfToken);
  if (first.ok || first.code !== "csrf") return first;
  return refreshAndPlace(apiOriginUrl, input);
}

export async function listOrders(apiOriginUrl: string): Promise<OrderListResult> {
  const result = await send(apiOriginUrl, "/orders", { method: "GET" });
  const orders = readOrderList(result.body);
  if (result.status === 200 && orders) return { ok: true, orders };
  return failure(result.status, readRawMessage(result.body));
}

export async function getOrder(apiOriginUrl: string, orderId: string): Promise<OrderResult> {
  const result = await send(apiOriginUrl, `/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  const order = readOrder(result.body);
  if (result.status === 200 && order) return { ok: true, order };
  if (result.status === 400 || result.status === 404) {
    return { ok: false, status: result.status, code: "missing", message: MISSING_MESSAGE };
  }
  return failure(result.status, readRawMessage(result.body));
}
