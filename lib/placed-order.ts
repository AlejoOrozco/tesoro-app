import type { Order } from "@/lib/order";

let placedOrder: Order | null = null;

export function rememberPlacedOrder(order: Order): void {
  placedOrder = order;
}

export function readPlacedOrder(orderId: string): Order | null {
  if (placedOrder?.id !== orderId) return null;
  return placedOrder;
}
