"use client";

import { cartTotal, type CartItem } from "@/lib/cart";
import { getCart, removeCartItem, setCartItemQuantity, type CartResult } from "@/lib/cart-api";
import { formatCop } from "@/lib/money";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartLine } from "./cart-line";
import styles from "./cart.module.css";

interface CartPanelProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
}

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly items: readonly CartItem[] };

interface CartBodyProps {
  readonly load: LoadState;
  readonly pendingItemId: string | null;
  readonly onQuantity: (itemId: string, quantity: number) => void;
  readonly onRemove: (itemId: string) => void;
  readonly onRetry: () => void;
}

interface CommitControls {
  readonly pendingRef: { current: string | null };
  readonly setPendingItemId: (itemId: string | null) => void;
  readonly setActionError: (message: string | null) => void;
  readonly setLoad: (load: LoadState) => void;
}

async function loadCart(apiOriginUrl: string): Promise<LoadState> {
  const result = await getCart(apiOriginUrl);
  if (!result.ok) return { status: "error", message: result.message };
  return { status: "ready", items: result.cart.items };
}

async function commit(controls: CommitControls, itemId: string, result: Promise<CartResult>): Promise<void> {
  controls.pendingRef.current = itemId;
  controls.setPendingItemId(itemId);
  const settled = await result;
  controls.pendingRef.current = null;
  controls.setPendingItemId(null);
  if (!settled.ok) {
    controls.setActionError(settled.message);
    return;
  }
  controls.setActionError(null);
  controls.setLoad({ status: "ready", items: settled.cart.items });
}

function useLoadedCart(apiOriginUrl: string, reloadKey: number, setLoad: (load: LoadState) => void): void {
  useEffect(() => {
    let isCurrent = true;
    void loadCart(apiOriginUrl).then((next) => {
      if (isCurrent) setLoad(next);
    });
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, reloadKey, setLoad]);
}

function useCart(apiOriginUrl: string) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const pendingRef = useRef<string | null>(null);
  useLoadedCart(apiOriginUrl, reloadKey, setLoad);

  function changeQuantity(itemId: string, quantity: number): void {
    if (pendingRef.current || quantity < 0) return;
    const controls = { pendingRef, setPendingItemId, setActionError, setLoad };
    void commit(controls, itemId, setCartItemQuantity(apiOriginUrl, itemId, quantity));
  }

  function removeLine(itemId: string): void {
    if (pendingRef.current) return;
    const controls = { pendingRef, setPendingItemId, setActionError, setLoad };
    void commit(controls, itemId, removeCartItem(apiOriginUrl, itemId));
  }

  return {
    load,
    actionError,
    pendingItemId,
    changeQuantity,
    removeLine,
    retry: () => setReloadKey((key) => key + 1),
  };
}

function CartBody({ load, pendingItemId, onQuantity, onRemove, onRetry }: CartBodyProps) {
  if (load.status === "loading") {
    return (
      <div aria-busy="true" aria-label="Cargando">
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }
  if (load.status === "error") {
    return (
      <div className={styles.empty}>
        <p className={styles.alert} role="alert">{load.message}</p>
        <button type="button" className={styles.retry} onClick={onRetry}>Reintentar</button>
      </div>
    );
  }
  if (load.items.length === 0) return <p className={styles.empty}>Tu carrito está vacío.</p>;
  return (
    <>
      <ul className={styles.list}>
        {load.items.map((item) => (
          <li key={item.id}>
            <CartLine
              item={item}
              isPending={pendingItemId === item.id}
              onQuantity={onQuantity}
              onRemove={onRemove}
            />
          </li>
        ))}
      </ul>
      <p className={styles.total}>Total <span>{formatCop(cartTotal(load.items))}</span></p>
    </>
  );
}

export function CartPanel({ apiOriginUrl, wwwOriginUrl }: CartPanelProps) {
  const cart = useCart(apiOriginUrl);

  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <h1>Carrito</h1>
        {cart.actionError ? <p className={styles.alert} role="alert">{cart.actionError}</p> : null}
        <CartBody
          load={cart.load}
          pendingItemId={cart.pendingItemId}
          onQuantity={cart.changeQuantity}
          onRemove={cart.removeLine}
          onRetry={cart.retry}
        />
        {cart.load.status === "ready" && cart.load.items.length > 0 ? (
          <Link className={styles.checkout} href="/checkout">Hacer pedido</Link>
        ) : null}
        <div className={styles.links}>
          <a href={wwwOriginUrl}>Volver al sitio</a>
          <Link href="/account">Cuenta</Link>
        </div>
      </section>
    </main>
  );
}
