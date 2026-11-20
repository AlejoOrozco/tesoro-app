"use client";

import { cloneElement, isValidElement, type ReactNode, useId } from "react";

interface HelpTipProps {
  readonly text: string;
}

export function HelpTip({ text }: HelpTipProps) {
  const tipId = useId();

  return (
    <span className="help">
      <button type="button" className="help-button" aria-describedby={tipId} aria-label="Más información">
        ?
      </button>
      <span className="help-tip" id={tipId} role="tooltip">
        {text}
      </span>
    </span>
  );
}

interface FieldProps {
  readonly label: string;
  readonly help: string;
  readonly plain?: boolean;
  readonly children: (fieldId: string) => ReactNode;
}

function withPlaceholder(node: ReactNode): ReactNode {
  if (!isValidElement<{ placeholder?: string; type?: string }>(node)) return node;
  if (node.type !== "input" && node.type !== "textarea") return node;
  if (node.props.type === "color" || node.props.placeholder) return node;
  return cloneElement(node, { placeholder: " " });
}

export function Field({ label, help, plain = false, children }: FieldProps) {
  const fieldId = useId();
  if (plain) {
    return (
      <div className="field">
        <div className="field-label">
          <label htmlFor={fieldId}>{label}</label>
          <HelpTip text={help} />
        </div>
        {children(fieldId)}
      </div>
    );
  }

  return (
    <div className="float-field">
      {withPlaceholder(children(fieldId))}
      <label htmlFor={fieldId}>{label}</label>
      <HelpTip text={help} />
    </div>
  );
}

interface CheckFieldProps {
  readonly label: string;
  readonly help: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function CheckField({ label, help, checked, onChange }: CheckFieldProps) {
  const fieldId = useId();

  return (
    <div className="check">
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={fieldId}>{label}</label>
      <HelpTip text={help} />
    </div>
  );
}

export const FIELD_HELP = {
  categoryName: "Es el nombre que ve el visitante en la tienda, por ejemplo Cocina.",
  slug: "Es el nombre que aparece en la URL. Por ejemplo, cafetera se ve como /productos/cafetera. Sirve para el posicionamiento en buscadores. Solo minúsculas, números y guiones simples.",
  productName: "Es el nombre que ve el visitante en la tarjeta y en la página del producto.",
  category: "Agrupa el producto en la tienda. El visitante puede ver solo los productos de esta categoría.",
  shortDescription: "Un resumen breve para la tarjeta del producto en la lista.",
  description: "El texto largo de la página del producto.",
  brand: "La marca del fabricante. Se muestra junto al producto.",
  weight: "Peso del producto en gramos. Se usa para calcular el envío.",
  length: "Largo del empaque en centímetros. Se usa para calcular el envío.",
  width: "Ancho del empaque en centímetros. Se usa para calcular el envío.",
  height: "Alto del empaque en centímetros. Se usa para calcular el envío.",
  warranty: "Meses de garantía que se muestran en la página. Escribe 0 si no tiene.",
  visible: "Si lo desmarcas, el producto deja de aparecer en la tienda. En este panel sigue visible.",
  featured: "Los productos destacados aparecen primero en la tienda.",
  colorName: "El nombre que ve el visitante, por ejemplo Negro. Cada color tiene su propio precio e inventario.",
  color: "El círculo de color del selector en la página del producto.",
  price: "Precio de venta de este color, en pesos, sin decimales. 45000 se muestra como $45.000.",
  compareAtPrice:
    "Es el precio anterior y debe ser mayor que el precio de venta. Con esos dos números la tienda calcula y muestra el porcentaje de descuento. Si lo dejas vacío, no hay descuento.",
  stock: "Unidades disponibles de este color. En 0, ese color queda sin inventario.",
  barcode: "Opcional. Solo lo ve este panel, no la tienda. No puede repetirse en otro producto.",
  defaultColor: "Es el color que se abre primero. Su precio es el que aparece en la lista de productos.",
  imageUrl: "Dirección de la imagen. Debe empezar por http:// o https://.",
  altText: "Describe la foto para quien no puede verla y para los buscadores.",
  sortOrder: "La foto con el número más bajo es la que aparece en la lista de la tienda.",
  imageColor: "Si eliges un color, la foto se muestra solo con ese color. Si lo dejas en todos, se ve siempre.",
} as const;
