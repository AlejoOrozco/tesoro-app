import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./order.module.css";

interface OrderScreenProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function OrderScreen({ title, children }: OrderScreenProps) {
  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <h1>{title}</h1>
        {children}
        <div className={styles.links}>
          <Link href="/cart">Carrito</Link>
          <Link href="/orders">Pedidos</Link>
          <Link href="/account">Cuenta</Link>
        </div>
      </section>
    </main>
  );
}

export function OrderLoading({ title = "Pedido" }: { readonly title?: string }) {
  return (
    <OrderScreen title={title}>
      <div aria-busy="true" aria-label="Cargando">
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    </OrderScreen>
  );
}

export function OrderDenied() {
  return (
    <OrderScreen title="Pedidos">
      <p className={styles.intro}>No tienes acceso a los pedidos.</p>
    </OrderScreen>
  );
}

export function OrderProblem({ message }: { readonly message: string }) {
  return (
    <OrderScreen title="Pedido">
      <p className={styles.alert} role="alert">{message}</p>
    </OrderScreen>
  );
}
