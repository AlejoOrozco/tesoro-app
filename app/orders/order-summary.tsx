import { formatCop } from "@/lib/money";
import { formatOrderDate, type Order, type OrderItem } from "@/lib/order";
import styles from "./order.module.css";

function swatchColor(hex: string): string {
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return "transparent";
}

function OrderLine({ item }: { readonly item: OrderItem }) {
  return (
    <li className={styles.line}>
      <div>
        <h2>{item.productName}</h2>
        <p className={styles.color}>
          <span className={styles.swatch} style={{ background: swatchColor(item.colorHex) }} aria-hidden="true" />
          {item.colorName}
        </p>
        <p className={styles.hint}>
          {formatCop(item.unitPrice)} · Cantidad {item.quantity}
        </p>
      </div>
      <p className={styles.amount}>{formatCop(item.subtotal)}</p>
    </li>
  );
}

export function OrderSummary({ order }: { readonly order: Order }) {
  return (
    <div className={styles.stack}>
      <p>{order.city}</p>
      <p>{order.addressLine}</p>
      <div className={styles.statuses}>
        <span className={styles.status}>Pedido: {order.orderStatus}</span>
        <span className={styles.status}>Pago: {order.paymentStatus}</span>
        <span className={styles.status}>Envío: {order.shippingStatus}</span>
      </div>
      <p className={styles.hint}>Hecho el {formatOrderDate(order.placedAt)}</p>
      <p className={styles.hold}>Las unidades quedan reservadas hasta {formatOrderDate(order.holdExpiresAt)}.</p>
      <ul className={styles.list}>
        {order.items.map((item) => <OrderLine key={item.id} item={item} />)}
      </ul>
      <p className={styles.total}>Total <span className={styles.amount}>{formatCop(order.total)}</span></p>
    </div>
  );
}
