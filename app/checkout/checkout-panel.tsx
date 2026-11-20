"use client";

import { type CartItem } from "@/lib/cart";
import { getCart } from "@/lib/cart-api";
import { loginPath } from "@/lib/return-path";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderDenied, OrderLoading, OrderProblem, OrderScreen } from "../orders/order-screen";
import { useClientGate, type ClientGate } from "../orders/use-client-gate";
import { CheckoutForm } from "./checkout-form";
import styles from "../orders/order.module.css";

interface CheckoutPanelProps {
  readonly apiOriginUrl: string;
}

interface CheckoutBodyProps {
  readonly apiOriginUrl: string;
  readonly gate: ClientGate;
  readonly cart: CartView;
  readonly denied: boolean;
  readonly onItems: (items: readonly CartItem[]) => void;
  readonly onEmpty: () => void;
  readonly onDenied: () => void;
  readonly onUnauthorized: () => void;
}

function CheckoutBody({ apiOriginUrl, gate, cart, denied, onItems, onEmpty, onDenied, onUnauthorized }: CheckoutBodyProps) {
  if (gate.status === "loading" || (gate.status === "ready" && cart.status === "loading")) return <OrderLoading />;
  if (denied || gate.status === "denied") return <OrderDenied />;
  if (gate.status === "error") return <OrderProblem message={gate.message} />;
  if (cart.status === "error") return <OrderProblem message={cart.message} />;
  if (cart.status === "empty") {
    return (
      <OrderScreen title="Pedido">
        <p className={styles.intro}>Tu carrito está vacío.</p>
        <Link className={styles.action} href="/cart">Volver al carrito</Link>
      </OrderScreen>
    );
  }
  if (cart.status !== "ready") return <OrderLoading />;
  return (
    <OrderScreen title="Pedido">
      <CheckoutForm
        apiOriginUrl={apiOriginUrl}
        items={cart.items}
        onItems={onItems}
        onEmpty={onEmpty}
        onDenied={onDenied}
        onUnauthorized={onUnauthorized}
      />
    </OrderScreen>
  );
}

type CartView =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "empty" }
  | { readonly status: "ready"; readonly items: readonly CartItem[] };

function useCheckoutCart(apiOriginUrl: string, enabled: boolean): readonly [CartView, (cart: CartView) => void] {
  const router = useRouter();
  const [cart, setCart] = useState<CartView>({ status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let isCurrent = true;
    void getCart(apiOriginUrl).then((result) => {
      if (!isCurrent) return;
      if (!result.ok) {
        if (result.status === 401) router.replace(loginPath("/checkout"));
        else setCart({ status: "error", message: result.message });
        return;
      }
      setCart(result.cart.items.length === 0 ? { status: "empty" } : { status: "ready", items: result.cart.items });
    });
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, enabled, router]);

  return [cart, setCart];
}

export function CheckoutPanel({ apiOriginUrl }: CheckoutPanelProps) {
  const router = useRouter();
  const gate = useClientGate(apiOriginUrl, "/checkout");
  const [cart, setCart] = useCheckoutCart(apiOriginUrl, gate.status === "ready");
  const [denied, setDenied] = useState(false);

  return (
    <CheckoutBody
      apiOriginUrl={apiOriginUrl}
      gate={gate}
      cart={cart}
      denied={denied}
      onItems={(items) => setCart(items.length === 0 ? { status: "empty" } : { status: "ready", items })}
      onEmpty={() => setCart({ status: "empty" })}
      onDenied={() => setDenied(true)}
      onUnauthorized={() => router.replace(loginPath("/checkout"))}
    />
  );
}
