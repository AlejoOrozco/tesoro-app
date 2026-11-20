"use client";

import { cartTotal, lineTotal, type CartItem } from "@/lib/cart";
import { formatCop } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import styles from "../orders/order.module.css";
import { submitCheckout, type CheckoutAttempt, type CheckoutFormProps } from "./checkout-submit";

export function CheckoutForm(props: CheckoutFormProps) {
  const router = useRouter();
  const cityId = useId();
  const addressId = useId();
  const attempt = useRef<CheckoutAttempt | null>(null);
  const pendingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      className={styles.stack}
      onSubmit={(event) => void submitCheckout(event, {
        ...props,
        attempt,
        pendingRef,
        setErrorMessage,
        setIsPending,
        router,
      })}
    >
      <p className={styles.intro}>Indica la ciudad y la dirección de entrega.</p>
      <CheckoutLines items={props.items} />
      <p className={styles.total}>Total <span className={styles.amount}>{formatCop(cartTotal(props.items))}</span></p>
      <DeliveryFields cityId={cityId} addressId={addressId} />
      {errorMessage ? <p className={styles.alert} role="alert">{errorMessage}</p> : null}
      <button className={styles.submit} type="submit" disabled={isPending}>
        {isPending ? "Confirmando…" : "Confirmar pedido"}
      </button>
    </form>
  );
}

function DeliveryFields({ cityId, addressId }: { readonly cityId: string; readonly addressId: string }) {
  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label htmlFor={cityId}>Ciudad</label>
        <input id={cityId} name="city" maxLength={80} autoComplete="address-level2" required />
      </div>
      <div className={styles.field}>
        <label htmlFor={addressId}>Dirección</label>
        <input id={addressId} name="addressLine" maxLength={160} autoComplete="street-address" placeholder="calle 25 # 30b-05" required />
      </div>
    </div>
  );
}

function CheckoutLines({ items }: { readonly items: readonly CartItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li className={styles.line} key={item.id}>
          <div>
            <h2>{item.productName}</h2>
            <p className={styles.hint}>{item.colorName} · Cantidad {item.quantity} · Stock {item.stock}</p>
          </div>
          <p className={styles.amount}>{formatCop(lineTotal(item))}</p>
        </li>
      ))}
    </ul>
  );
}

