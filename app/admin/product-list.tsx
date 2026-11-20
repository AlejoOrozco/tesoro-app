import { EmptyState } from "@/app/admin/empty-state";
import { defaultPrice, type AdminProduct } from "@/lib/catalog";
import { formatCop } from "@/lib/money";
import Link from "next/link";

interface ProductListProps {
  readonly products: readonly AdminProduct[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h1 className="dashboard-title">Productos</h1>
        <Link className="button" href="/admin/products/new">
          Nuevo producto
        </Link>
      </div>
      {products.length === 0 ? <EmptyState message="Todavía no hay productos." /> : null}
      {products.map((product) => (
        <article className="item" key={product.id}>
          <div className="item-row">
            <div>
              <strong>{product.name}</strong>
              <p className="hint">
                {product.category.name} · {formatCop(defaultPrice(product))}
              </p>
            </div>
            <div className="badges">
              <span className={product.isActive ? "badge ok" : "badge"}>
                {product.isActive ? "Visible" : "Oculto"}
              </span>
              {product.isFeatured ? <span className="badge">Destacado</span> : null}
            </div>
          </div>
          <Link href={`/admin/products/${product.id}`}>Editar</Link>
        </article>
      ))}
    </section>
  );
}
