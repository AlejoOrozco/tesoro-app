export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface ProductImage {
  readonly id: string;
  readonly variantId: string | null;
  readonly url: string;
  readonly altText: string;
  readonly sortOrder: number;
}

export interface ProductVariant {
  readonly id: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly price: number;
  readonly compareAtPrice: number | null;
  readonly stock: number;
  readonly barcode: string | null;
  readonly isDefault: boolean;
}

export interface AdminProduct {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly brand: string | null;
  readonly category: Category;
  readonly isFeatured: boolean;
  readonly isActive: boolean;
  readonly weightGrams: number | null;
  readonly lengthCm: number | null;
  readonly widthCm: number | null;
  readonly heightCm: number | null;
  readonly warrantyMonths: number | null;
  readonly variants: readonly ProductVariant[];
  readonly images: readonly ProductImage[];
}

export interface CategoryWrite {
  readonly name: string;
  readonly slug: string;
}

export interface VariantWrite {
  readonly colorName: string;
  readonly colorHex: string;
  readonly price: number;
  readonly stock: number;
  readonly barcode: string | null;
  readonly isDefault: boolean;
  readonly compareAtPrice?: number;
}

export interface ProductWrite {
  readonly name: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly brand: string;
  readonly weightGrams: number | null;
  readonly lengthCm: number | null;
  readonly widthCm: number | null;
  readonly heightCm: number | null;
  readonly warrantyMonths: number | null;
  readonly isActive: boolean;
  readonly isFeatured: boolean;
  readonly variants?: readonly VariantWrite[];
}

export interface ImageWrite {
  readonly url: string;
  readonly altText: string;
  readonly sortOrder: number;
  readonly variantId: string | null;
}

export function defaultPrice(product: AdminProduct): number {
  const selected = product.variants.find((variant) => variant.isDefault);
  const variant = selected ?? product.variants[0];
  if (!variant) return 0;
  return variant.price;
}
