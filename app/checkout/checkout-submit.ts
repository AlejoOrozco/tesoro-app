import type { CartItem } from "@/lib/cart";
import { getCart } from "@/lib/cart-api";
import { cartFingerprint, deliveryError } from "@/lib/order";
import { placeOrder, type OrderResult } from "@/lib/order-api";
import { rememberPlacedOrder } from "@/lib/placed-order";
import type { FormEvent } from "react";

export interface CheckoutFormProps {
  readonly apiOriginUrl: string;
  readonly items: readonly CartItem[];
  readonly onItems: (items: readonly CartItem[]) => void;
  readonly onEmpty: () => void;
  readonly onDenied: () => void;
  readonly onUnauthorized: () => void;
}

export interface CheckoutAttempt {
  readonly fingerprint: string;
  readonly key: string;
  readonly failedOnNetwork: boolean;
}

interface AttemptRef {
  current: CheckoutAttempt | null;
}

function nextIdempotencyKey(attempt: AttemptRef, fingerprint: string): string {
  const previous = attempt.current;
  if (previous?.failedOnNetwork && previous.fingerprint === fingerprint) return previous.key;
  const key = crypto.randomUUID();
  attempt.current = { fingerprint, key, failedOnNetwork: false };
  return key;
}

function markNetworkFailure(attempt: AttemptRef): void {
  const current = attempt.current;
  if (!current) return;
  attempt.current = { ...current, failedOnNetwork: true };
}

interface SubmitContext extends CheckoutFormProps {
  readonly attempt: AttemptRef;
  readonly pendingRef: { current: boolean };
  readonly setErrorMessage: (message: string | null) => void;
  readonly setIsPending: (pending: boolean) => void;
  readonly router: { push: (path: string) => void };
}

export async function submitCheckout(event: FormEvent<HTMLFormElement>, context: SubmitContext): Promise<void> {
  event.preventDefault();
  if (context.pendingRef.current) return;
  const formData = new FormData(event.currentTarget);
  const city = String(formData.get("city") ?? "");
  const addressLine = String(formData.get("addressLine") ?? "");
  const problem = deliveryError(city, addressLine);
  if (problem) {
    context.setErrorMessage(problem);
    return;
  }
  context.pendingRef.current = true;
  context.setIsPending(true);
  context.setErrorMessage(null);
  const outcome = await placeCurrentOrder(context.apiOriginUrl, context.items, city.trim(), addressLine.trim(), context.attempt);
  await applyOutcome(outcome, context);
  context.pendingRef.current = false;
  context.setIsPending(false);
}

type PlaceOutcome =
  | { readonly type: "changed"; readonly items: readonly CartItem[] }
  | { readonly type: "empty" }
  | { readonly type: "result"; readonly result: OrderResult };

async function placeCurrentOrder(
  apiOriginUrl: string,
  items: readonly CartItem[],
  city: string,
  addressLine: string,
  attempt: AttemptRef,
): Promise<PlaceOutcome> {
  const fresh = await getCart(apiOriginUrl);
  if (!fresh.ok) return { type: "result", result: cartToOrderFailure(fresh) };
  if (cartFingerprint(fresh.cart.items) !== cartFingerprint(items)) {
    return fresh.cart.items.length === 0 ? { type: "empty" } : { type: "changed", items: fresh.cart.items };
  }
  const result = await placeOrder(apiOriginUrl, {
    city,
    addressLine,
    idempotencyKey: nextIdempotencyKey(attempt, cartFingerprint(items)),
  });
  if (!result.ok && result.code === "network") markNetworkFailure(attempt);
  if (result.ok) attempt.current = null;
  return { type: "result", result };
}

function cartToOrderFailure(result: { readonly status: number; readonly message: string }): OrderResult {
  if (result.status === 401) {
    return { ok: false, status: 401, code: "unauthorized", message: "Inicia sesión para continuar." };
  }
  return {
    ok: false,
    status: result.status,
    code: result.status === 0 ? "network" : "other",
    message: result.message,
  };
}

interface OutcomeHandlers {
  readonly onItems: (items: readonly CartItem[]) => void;
  readonly onEmpty: () => void;
  readonly onDenied: () => void;
  readonly onUnauthorized: () => void;
  readonly setErrorMessage: (message: string) => void;
  readonly router: { push: (path: string) => void };
  readonly apiOriginUrl: string;
}

async function applyOutcome(outcome: PlaceOutcome, handlers: OutcomeHandlers): Promise<void> {
  if (outcome.type === "changed") {
    handlers.onItems(outcome.items);
    handlers.setErrorMessage("El carrito cambió. Revísalo antes de confirmar.");
    return;
  }
  if (outcome.type === "empty") {
    handlers.onEmpty();
    return;
  }
  if (!outcome.result.ok) {
    showFailure(outcome.result, handlers);
    return;
  }
  rememberPlacedOrder(outcome.result.order);
  await getCart(handlers.apiOriginUrl);
  handlers.router.push(`/checkout/confirmation/${outcome.result.order.id}`);
}

function showFailure(result: Extract<OrderResult, { ok: false }>, handlers: OutcomeHandlers): void {
  if (result.code === "unauthorized") {
    handlers.onUnauthorized();
    return;
  }
  if (result.code === "forbidden") {
    handlers.onDenied();
    return;
  }
  if (result.code === "empty") {
    handlers.onEmpty();
    return;
  }
  handlers.setErrorMessage(result.message);
}
