"use client";

import { formatCop } from "@/lib/money";
import { formatOrderDate, type Order } from "@/lib/order";
import { listOrders } from "@/lib/order-api";
import { loginPath } from "@/lib/return-path";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderDenied, OrderLoading, OrderProblem, OrderScreen } from "./order-screen";
import { useClientGate, type ClientGate } from "./use-client-gate";
import styles from "./order.module.css";

interface OrderListPanelProps {
  readonly apiOriginUrl: string;
}

function useOrders(apiOriginUrl: string, enabled: boolean) {
  const router = useRouter();
  const [orders, setOrders] = useState<readonly Order[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let isCurrent = true;
    void listOrders(apiOriginUrl).then((result) => {
      if (!isCurrent) return;
      if (result.ok) {
        setOrders(result.orders);
        return;
      }
      if (result.code === "unauthorized") router.replace(loginPath("/orders"));
      else if (result.code === "forbidden") setDenied(true);
      else setProblem(result.message);
    });
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, enabled, router]);

  return { orders, problem, denied };
}

interface LoadedOrders {
  readonly orders: readonly Order[] | null;
  readonly problem: string | null;
  readonly denied: boolean;
}

function OrderListBody({ gate, loaded }: { readonly gate: ClientGate; readonly loaded: LoadedOrders }) {
  if (gate.status === "loading" || (gate.status === "ready" && !loaded.orders && !loaded.problem && !loaded.denied)) {
    return <OrderLoading title="Pedidos" />;
  }
  if (loaded.denied || gate.status === "denied") return <OrderDenied />;
  if (gate.status === "error") return <OrderProblem message={gate.message} />;
  if (!loaded.orders) return <OrderProblem message={loaded.problem ?? "No se pudo completar la solicitud."} />;
  if (loaded.orders.length === 0) {
    return (
      <OrderScreen title="Pedidos">
        <p className={styles.intro}>Todavía no tienes pedidos.</p>
      </OrderScreen>
    );
  }
  return (
    <OrderScreen title="Pedidos">
      <ul className={styles.list}>
        {loaded.orders.map((order) => <OrderRow key={order.id} order={order} />)}
      </ul>
    </OrderScreen>
  );
}

export function OrderListPanel({ apiOriginUrl }: OrderListPanelProps) {
  const gate = useClientGate(apiOriginUrl, "/orders");
  const loaded = useOrders(apiOriginUrl, gate.status === "ready");
  return <OrderListBody gate={gate} loaded={loaded} />;
}

function OrderRow({ order }: { readonly order: Order }) {
  return (
    <li className={styles.orderRow}>
      <Link href={`/orders/${order.id}`}>{formatOrderDate(order.placedAt)}</Link>
      <p className={styles.hint}>{order.city} · {order.orderStatus} · {order.paymentStatus} · {order.shippingStatus}</p>
      <p className={styles.amount}>{formatCop(order.total)}</p>
    </li>
  );
}
