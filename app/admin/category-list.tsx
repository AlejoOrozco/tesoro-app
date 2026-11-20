"use client";

import { EmptyState } from "@/app/admin/empty-state";
import { Field, FIELD_HELP } from "@/app/admin/field-help";
import { HoldButton } from "@/app/admin/hold-button";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin-api";
import type { Category } from "@/lib/catalog";
import { type FormEvent, useState } from "react";

interface CategoryListProps {
  readonly apiOriginUrl: string;
  readonly categories: readonly Category[];
  readonly onChange: () => Promise<void>;
}

export function CategoryList({ apiOriginUrl, categories, onChange }: CategoryListProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <section className="panel">
      <div className="panel-head">
        <h1 className="dashboard-title">Categorías</h1>
      </div>
      {categories.length === 0 ? (
        <EmptyState message="Todavía no hay categorías. Crea la primera con el formulario de abajo." />
      ) : null}
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          apiOriginUrl={apiOriginUrl}
          category={category}
          onChange={onChange}
          onError={setErrorMessage}
        />
      ))}
      <CategoryCreate apiOriginUrl={apiOriginUrl} onChange={onChange} onError={setErrorMessage} />
      {errorMessage ? <p className="alert" role="alert">{errorMessage}</p> : null}
    </section>
  );
}

interface CategoryRowProps {
  readonly apiOriginUrl: string;
  readonly category: Category;
  readonly onChange: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function CategoryRow({ apiOriginUrl, category, onChange, onError }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    onError(null);
    const result = await updateCategory(apiOriginUrl, category.id, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
    });
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    setIsEditing(false);
    await onChange();
  }

  async function handleDelete(): Promise<void> {
    setIsSaving(true);
    onError(null);
    const result = await deleteCategory(apiOriginUrl, category.id);
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    await onChange();
  }

  if (!isEditing) {
    return (
      <article className="item">
        <div className="item-row">
          <div>
            <strong>{category.name}</strong>
            <p className="hint">{category.slug}</p>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setIsEditing(true)}>
              Editar
            </button>
            <HoldButton disabled={isSaving} onHold={() => void handleDelete()}>
              Mantén para eliminar
            </HoldButton>
          </div>
        </div>
      </article>
    );
  }

  return (
    <form className="item stack" onSubmit={handleSave}>
      <Field label="Nombre" help={FIELD_HELP.categoryName}>
        {(fieldId) => <input id={fieldId} name="name" defaultValue={category.name} required />}
      </Field>
      <Field label="Slug" help={FIELD_HELP.slug}>
        {(fieldId) => <input id={fieldId} name="slug" defaultValue={category.slug} required />}
      </Field>
      <div className="actions">
        <button type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="secondary" onClick={() => setIsEditing(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface CategoryCreateProps {
  readonly apiOriginUrl: string;
  readonly onChange: () => Promise<void>;
  readonly onError: (message: string | null) => void;
}

function CategoryCreate({ apiOriginUrl, onChange, onError }: CategoryCreateProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSaving(true);
    onError(null);
    const result = await createCategory(apiOriginUrl, {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
    });
    setIsSaving(false);
    if (!result.ok) {
      onError(result.message);
      return;
    }
    form.reset();
    await onChange();
  }

  return (
    <form className="stack" onSubmit={handleCreate}>
      <Field label="Nombre" help={FIELD_HELP.categoryName}>
        {(fieldId) => <input id={fieldId} name="name" required />}
      </Field>
      <Field label="Slug" help={FIELD_HELP.slug}>
        {(fieldId) => <input id={fieldId} name="slug" required />}
      </Field>
      <button type="submit" disabled={isSaving} aria-busy={isSaving}>
        {isSaving ? "Creando…" : "Crear categoría"}
      </button>
    </form>
  );
}
