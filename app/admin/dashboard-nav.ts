export type DashboardIconName = "home" | "products" | "categories";

export interface DashboardSection {
  readonly href: "/admin" | "/admin/products" | "/admin/categories";
  readonly label: string;
  readonly icon: DashboardIconName;
}

export const DASHBOARD_SECTIONS: readonly DashboardSection[] = [
  { href: "/admin", label: "Inicio", icon: "home" },
  { href: "/admin/products", label: "Productos", icon: "products" },
  { href: "/admin/categories", label: "Categorías", icon: "categories" },
];

export function isDashboardSectionActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
