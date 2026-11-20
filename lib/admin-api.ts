import {
  readAdminProduct,
  readAdminProductList,
  readCategory,
  readCategoryList,
} from "@/lib/catalog-read";
import type {
  AdminProduct,
  Category,
  CategoryWrite,
  ImageWrite,
  ProductWrite,
  VariantWrite,
} from "@/lib/catalog";
import { failed, publicGet, adminCall, SERVER_UNREACHABLE_MESSAGE, type AdminResult } from "@/lib/admin-http";
export async function listCategories(apiOriginUrl: string): Promise<AdminResult<readonly Category[]>> {
  const result = await publicGet(apiOriginUrl, "/categories");
  if (result.status === 0) return { ok: false, status: 0, message: SERVER_UNREACHABLE_MESSAGE };
  const categories = readCategoryList(result.body);
  if (result.status !== 200 || !categories) return failed(result.status, result.body);
  return { ok: true, data: categories };
}

export async function createCategory(
  apiOriginUrl: string,
  category: CategoryWrite,
): Promise<AdminResult<Category>> {
  const result = await adminCall(apiOriginUrl, "/admin/categories", { method: "POST", body: category });
  const created = readCategory(result.body);
  if (result.status !== 201 || !created) return failed(result.status, result.body);
  return { ok: true, data: created };
}

export async function updateCategory(
  apiOriginUrl: string,
  categoryId: string,
  category: CategoryWrite,
): Promise<AdminResult<Category>> {
  const result = await adminCall(apiOriginUrl, `/admin/categories/${categoryId}`, {
    method: "PATCH",
    body: category,
  });
  const updated = readCategory(result.body);
  if (result.status !== 200 || !updated) return failed(result.status, result.body);
  return { ok: true, data: updated };
}

export async function deleteCategory(apiOriginUrl: string, categoryId: string): Promise<AdminResult<null>> {
  const result = await adminCall(apiOriginUrl, `/admin/categories/${categoryId}`, { method: "DELETE" });
  if (result.status !== 204) return failed(result.status, result.body);
  return { ok: true, data: null };
}

export async function listAdminProducts(apiOriginUrl: string): Promise<AdminResult<readonly AdminProduct[]>> {
  const result = await adminCall(apiOriginUrl, "/admin/products", { method: "GET" });
  if (result.status === 0) return { ok: false, status: 0, message: SERVER_UNREACHABLE_MESSAGE };
  const products = readAdminProductList(result.body);
  if (result.status !== 200 || !products) return failed(result.status, result.body);
  return { ok: true, data: products };
}

export async function getAdminProduct(
  apiOriginUrl: string,
  productId: string,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}`, { method: "GET" });
  const product = readAdminProduct(result.body);
  if (result.status !== 200 || !product) return failed(result.status, result.body);
  return { ok: true, data: product };
}

export async function createProduct(
  apiOriginUrl: string,
  product: ProductWrite,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(apiOriginUrl, "/admin/products", { method: "POST", body: product });
  const created = readAdminProduct(result.body);
  if (result.status !== 201 || !created) return failed(result.status, result.body);
  return { ok: true, data: created };
}

export async function updateProduct(
  apiOriginUrl: string,
  productId: string,
  product: ProductWrite,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}`, {
    method: "PATCH",
    body: product,
  });
  const updated = readAdminProduct(result.body);
  if (result.status !== 200 || !updated) return failed(result.status, result.body);
  return { ok: true, data: updated };
}

export async function deleteProduct(apiOriginUrl: string, productId: string): Promise<AdminResult<null>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}`, { method: "DELETE" });
  if (result.status !== 204) return failed(result.status, result.body);
  return { ok: true, data: null };
}

export async function createVariant(
  apiOriginUrl: string,
  productId: string,
  variant: VariantWrite,
): Promise<AdminResult<null>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}/variants`, {
    method: "POST",
    body: variant,
  });
  if (result.status !== 201) return failed(result.status, result.body);
  return { ok: true, data: null };
}

export async function updateVariant(
  apiOriginUrl: string,
  productId: string,
  variantId: string,
  variant: VariantWrite,
): Promise<AdminResult<null>> {
  const result = await adminCall(
    apiOriginUrl,
    `/admin/products/${productId}/variants/${variantId}`,
    { method: "PATCH", body: variant },
  );
  if (result.status !== 200) return failed(result.status, result.body);
  return { ok: true, data: null };
}

export async function deleteVariant(
  apiOriginUrl: string,
  productId: string,
  variantId: string,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(
    apiOriginUrl,
    `/admin/products/${productId}/variants/${variantId}`,
    { method: "DELETE" },
  );
  const product = readAdminProduct(result.body);
  if (result.status !== 200 || !product) return failed(result.status, result.body);
  return { ok: true, data: product };
}

export async function createImage(
  apiOriginUrl: string,
  productId: string,
  image: ImageWrite,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}/images`, {
    method: "POST",
    body: image,
  });
  const product = readAdminProduct(result.body);
  if (result.status !== 201 || !product) return failed(result.status, result.body);
  return { ok: true, data: product };
}

export async function deleteImage(
  apiOriginUrl: string,
  productId: string,
  imageId: string,
): Promise<AdminResult<AdminProduct>> {
  const result = await adminCall(apiOriginUrl, `/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
  const product = readAdminProduct(result.body);
  if (result.status !== 200 || !product) return failed(result.status, result.body);
  return { ok: true, data: product };
}
