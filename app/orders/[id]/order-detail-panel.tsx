"use client";

import { isOrderId, type Order } from "@/lib/order";
import { getOrder } from "@/lib/order-api";
import { loginPath } from "@/lib/return-path";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderDenied, OrderLoading, OrderProblem, OrderScreen } from "../order-screen";
import { OrderSummary } from "../order-summary";
import { useClientGate } from "../use-client-gate";

interface OrderDetailPanelProps {
  readonly apiOriginUrl: string;
  readonly orderId: string;
}

export function OrderDetailPanel({ apiOriginUrl, orderId }: OrderDetailPanelProps) {
  const router = useRouter();
  const returnPath = `/orders/${orderId}`;
  const gate = useClientGate(apiOriginUrl, returnPath);
  const [order, setOrder] = useState<Order | null>(null);
  const [problem, setProblem] = useState<string | null>(isOrderId(orderId) ? null : "No encontramos este pedido.");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (gate.status !== "ready" || !isOrderId(orderId)) return;
    let isCurrent = true;
    void getOrder(apiOriginUrl, orderId).then((result) => {
      if (!isCurrent) return;
      if (result.ok) {
        setOrder(result.order);
        return;
      }
      if (result.code === "unauthorized") router.replace(loginPath(returnPath));
      else if (result.code === "forbidden") setDenied(true);
      else setProblem(result.message);
    });
    return () => {
      isCurrent = false;
    };
  }, [apiOriginUrl, gate.status, orderId, returnPath, router]);

  if (gate.status === "loading" || (gate.status === "ready" && isOrderId(orderId) && !order && !problem && !denied)) {
    return <OrderLoading />;
  }
  if (denied || gate.status === "denied") return <OrderDenied />;
  if (gate.status === "error") return <OrderProblem message={gate.message} />;
  if (!order) return <OrderProblem message={problem ?? "No encontramos este pedido."} />;

  return (
    <OrderScreen title="Pedido">
      <OrderSummary order={order} />
    </OrderScreen>
  );
}
