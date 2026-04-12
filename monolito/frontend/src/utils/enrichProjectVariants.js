/**
 * P4: enriquecer metadatos de variables (catálogo products; Catalog no llama a Products).
 * Catálogo puede traer name vacío; Products tiene el nombre del diseño. Emparejar por id,
 * sapRef o nombre; rellenar name/value desde Products solo si en catálogo vienen vacíos.
 */
export function mergeComponentMetaFromProducts(catalogComps, productComps) {
  if (!catalogComps?.length || !productComps?.length) return catalogComps || [];
  const trim = (s) => (s == null ? '' : String(s).trim());
  return catalogComps.map((c) => {
    const m =
      productComps.find((p) => p.id && c.id && String(p.id) === String(c.id)) ||
      productComps.find(
        (p) =>
          trim(p.sapRef) &&
          trim(c.sapRef) &&
          trim(p.sapRef).toUpperCase() === trim(c.sapRef).toUpperCase()
      ) ||
      productComps.find(
        (p) =>
          trim(p.name) &&
          trim(c.name) &&
          trim(p.name).toUpperCase() === trim(c.name).toUpperCase()
      );
    if (!m) return c;
    const nameFromCatalog = trim(c.name);
    const nameFromProduct = trim(m.name);
    return {
      ...c,
      name: nameFromCatalog || nameFromProduct || c.name,
      editable: m.editable !== false,
      listOnly: m.listOnly === true,
    };
  });
}

function resolveCatalogVariant(v, products) {
  if (!products?.length) return null;
  const byPid = v.productVariantId;
  if (byPid) {
    for (const p of products) {
      const pv = p.variants?.find((pv) => String(pv.id) === String(byPid));
      if (pv) return { p, pv };
    }
  }
  if (v.baseId) {
    const p = products.find((b) => String(b.id) === String(v.baseId));
    const rows = p?.variants;
    if (rows?.length && v.sapRef) {
      const pv = rows.find(
        (x) =>
          String(x.sapRef ?? '') === String(v.sapRef) ||
          String(x.sapCode ?? '') === String(v.sapRef)
      );
      if (pv) return { p, pv };
    }
  }
  const fallbackPid = v.id;
  for (const p of products) {
    const pv = p.variants?.find((pv) => String(pv.id) === String(fallbackPid));
    if (pv) return { p, pv };
  }
  return null;
}

/** Une filas de proyecto con variantes del catálogo en memoria (editable/listOnly vienen de Products). */
export function enrichVariantsWithProducts(variants, products) {
  if (!variants?.length || !products?.length) return variants || [];
  return variants.map((v) => {
    const hit = resolveCatalogVariant(v, products);
    if (!hit) return v;
    const { p, pv } = hit;
    const pvRows = pv.variables ?? pv.components ?? [];
    const mergedComps = v.components?.length ? v.components : pvRows;
    return {
      ...v,
      sapRef: v.sapRef ?? pv.sapRef,
      sapCode: v.sapCode ?? pv.sapCode,
      baseId: v.baseId ?? p.id,
      baseName: v.baseName ?? p.name,
      baseImage: v.baseImage ?? pv.image,
      category: v.category ?? p.category,
      subcategory: v.subcategory ?? p.subcategory,
      line: v.line ?? p.line,
      components: mergeComponentMetaFromProducts(mergedComps, pvRows),
    };
  });
}
