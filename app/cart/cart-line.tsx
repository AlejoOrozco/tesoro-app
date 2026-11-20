"use client";

import { canIncreaseQuantity, lineTotal, type CartItem } from "@/lib/cart";
import { formatCop } from "@/lib/money";
import styles from "./cart.module.css";

interface CartLineProps {
  readonly item: CartItem;
  readonly isPending: boolean;
  readonly onQuantity: (itemId: string, quantity: number) => void;
  readonly onRemove: (itemId: string) => void;
}

function swatchColor(hex: string): string {
  if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return "transparent";
}

function LineImage({ item }: { readonly item: CartItem }) {
  if (!item.image) return <div className={styles.photoFallback} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.photo} src={item.image.url} alt={item.image.altText} />;
}

function LinePrice({ item }: { readonly item: CartItem }) {
  return (
    <p className={styles.price}>
      <span>{formatCop(item.price)}</span>
      {item.compareAtPrice !== null ? <s>{formatCop(item.compareAtPrice)}</s> : null}
      <span className={styles.lineTotal}>
        <span className={styles.srOnly}>Total de la línea </span>
        {formatCop(lineTotal(item))}
      </span>
    </p>
  );
}

function QuantityControls({ item, isPending, onQuantity }: Omit<CartLineProps, "onRemove">) {
  return (
    <div className={styles.quantity} role="group" aria-label={`Cantidad de ${item.productName}`}>
      <button
        type="button"
        className={styles.adjust}
        disabled={isPending || item.quantity === 0}
        onClick={() => onQuantity(item.id, item.quantity - 1)}
        aria-label="Bajar cantidad"
      >
        −
      </button>
      <span>{item.quantity}</span>
      <button
        type="button"
        className={styles.adjust}
        disabled={isPending || !canIncreaseQuantity(item)}
        onClick={() => onQuantity(item.id, item.quantity + 1)}
        aria-label="Subir cantidad"
      >
        +
      </button>
    </div>
  );
}

export function CartLine({ item, isPending, onQuantity, onRemove }: CartLineProps) {
  return (
    <article className={styles.line}>
      <LineImage item={item} />
      <div className={styles.details}>
        <h2>{item.productName}</h2>
        <p className={styles.color}>
          <span className={styles.swatch} style={{ background: swatchColor(item.colorHex) }} aria-hidden="true" />
          {item.colorName}
        </p>
        <LinePrice item={item} />
        <p className={styles.stock}>Stock: {item.stock}</p>
        {item.available ? null : <p className={styles.unavailable}>No disponible</p>}
        {item.quantity > item.stock ? (
          <p className={styles.hint}>La cantidad supera el stock. Bájala para poder continuar.</p>
        ) : null}
        <div className={styles.actions}>
          <QuantityControls item={item} isPending={isPending} onQuantity={onQuantity} />
          <button type="button" className={styles.remove} disabled={isPending} onClick={() => onRemove(item.id)}>
            Quitar
          </button>
        </div>
      </div>
    </article>
  );
}
