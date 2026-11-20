import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { CategoriesIcon, ProductsIcon } from "./dashboard-icons";

export const metadata: Metadata = {
  title: "Administración",
};

export default function AdminPage(): ReactElement {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Inicio</h1>
      <p className="hint">El catálogo de la tienda.</p>
      <div className="dashboard-home-grid">
        <Link className="dashboard-entry" href="/admin/products">
          <ProductsIcon />
          <span className="dashboard-entry-title">Productos</span>
          <span className="hint">Precios, colores y fotos.</span>
        </Link>
        <Link className="dashboard-entry" href="/admin/categories">
          <CategoriesIcon />
          <span className="dashboard-entry-title">Categorías</span>
          <span className="hint">Los grupos del catálogo.</span>
        </Link>
      </div>
    </div>
  );
}
