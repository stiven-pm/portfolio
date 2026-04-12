/** Valores distintos ya usados en catálogo para un nombre de variable (normalizado). */
export function collectValuesForVariableName(products, variableName) {
  const needle = String(variableName || '').trim().toUpperCase();
  if (!needle) return [];
  const set = new Set();
  for (const p of products || []) {
    for (const v of p.variants || []) {
      for (const c of v.components || []) {
        if (String(c.name || '').trim().toUpperCase() !== needle) continue;
        if (c.value != null && String(c.value).trim()) set.add(String(c.value).trim());
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Opciones para «solo lista» en carrito: catálogo global + variantes del mismo ítem (por si el producto aún no está en memoria). */
export function collectListOptionsForVariableName(item, products, variableName) {
  const needle = String(variableName || '').trim().toUpperCase();
  if (!needle) return [];
  const set = new Set(collectValuesForVariableName(products, variableName));
  for (const v of item?.variants || []) {
    for (const c of v.components || []) {
      if (String(c.name || '').trim().toUpperCase() !== needle) continue;
      if (c.value != null && String(c.value).trim()) set.add(String(c.value).trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}
