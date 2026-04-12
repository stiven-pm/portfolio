/**
 * GraphQL expone `variables` (dominio); el front usa `components` en la mayoría del código.
 * Siempre devuelve `components` como array (vacío si no hay filas) para no leer solo `variables` en UI.
 */
export function normalizeVariantRows(v) {
  if (!v) return v;
  const raw = v.variables ?? v.components;
  const rows = Array.isArray(raw) ? raw : [];
  return { ...v, components: rows };
}

export function normalizeProjectVariants(project) {
  if (!project?.variants?.length) return project;
  return {
    ...project,
    variants: project.variants.map(normalizeVariantRows),
  };
}

export function normalizeProjectsList(projects) {
  return (projects || []).map(normalizeProjectVariants);
}
