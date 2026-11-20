import type { ReactElement, ReactNode } from "react";
import type { DashboardIconName } from "./dashboard-nav";

interface IconProps {
  readonly className?: string;
}

function IconFrame({ className, children }: IconProps & { readonly children: ReactNode }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function HomeIcon({ className }: IconProps): ReactElement {
  return (
    <IconFrame className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </IconFrame>
  );
}

export function ProductsIcon({ className }: IconProps): ReactElement {
  return (
    <IconFrame className={className}>
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5zM12 12.2 20 8.2M12 12.2V20M12 12.2 4 8.2" />
    </IconFrame>
  );
}

export function CategoriesIcon({ className }: IconProps): ReactElement {
  return (
    <IconFrame className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </IconFrame>
  );
}

export function PanelIcon({ className }: IconProps): ReactElement {
  return (
    <IconFrame className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9 4.5v15" />
    </IconFrame>
  );
}

const ICONS = {
  home: HomeIcon,
  products: ProductsIcon,
  categories: CategoriesIcon,
} as const;

export function DashboardIcon({ name, className }: { readonly name: DashboardIconName; readonly className?: string }): ReactElement {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}
