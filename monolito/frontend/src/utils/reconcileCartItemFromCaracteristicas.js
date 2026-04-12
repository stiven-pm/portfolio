import { calculateTipologia } from './calculateTipologia';

/** Baseline de catálogo por componente (alineado con ProjectProductsTable / cotizadas). */
export function catalogComponentBaseline(c) {
  return String(c?.catalogOriginalValue ?? c?.originalValue ?? c?.value ?? '').trim();
}

export function itemMatchesSelectedVariantCatalog(item, caracteristicas) {
  const selectedVariant =
    item._selectedVariantId && item.variants?.length
      ? item.variants.find((v) => String(v.id) === String(item._selectedVariantId))
      : item.variants?.[0];
  if (!selectedVariant) return false;
  return (selectedVariant.components || []).every((c) => {
    if (!c?.id) return true;
    const baseline = catalogComponentBaseline(c);
    const hasKey = Object.prototype.hasOwnProperty.call(caracteristicas || {}, c.id);
    const cur = hasKey ? String(caracteristicas?.[c.id] ?? '').trim() : baseline;
    return cur === baseline;
  });
}

/**
 * Variante en proyecto (p. ej. solicitudes cotizadas): P4 si coincide catálogo;
 * P1/P2 por diff vs baseline; P3/P5 no se recalculan.
 */
export function resolveProjectQuotedVariantType(v, updated) {
  const lowerType = String(v?.type || '').toLowerCase();
  if (lowerType === 'p3' || lowerType === 'p5') return v.type;
  const originalByKey = Object.fromEntries(
    (v.components || []).map((x) => [x?.name || x.id, catalogComponentBaseline(x)])
  );
  const updatedByKey = Object.fromEntries(
    Object.entries(updated || {}).map(([id, val]) => {
      const comp = (v.components || []).find((x) => String(x.id) === String(id));
      return [comp?.name || id, val ?? ''];
    })
  );
  const calcType = calculateTipologia(originalByKey, updatedByKey);
  const matchesCatalog = (v.components || []).every((x) => {
    if (!x?.id) return true;
    const baseline = catalogComponentBaseline(x);
    const hasKey = Object.prototype.hasOwnProperty.call(updated || {}, x.id);
    const cur = hasKey ? String(updated?.[x.id] ?? '').trim() : baseline;
    return cur === baseline;
  });
  if (matchesCatalog) return 'p4';
  if (calcType !== '') return calcType;
  return 'p1';
}

/**
 * Tras cambiar características en carrito/proyecto, recalcula tipología y restaura
 * sapRef/sapCode de la variante de catálogo cuando los valores vuelven a coincidir (P4).
 */
export function reconcileCartItemFromCaracteristicas(item, caracteristicas) {
  const locked = String(item.type || item.tipologia || '').toLowerCase();
  if (locked === 'p3' || locked === 'p5') {
    return { caracteristicas };
  }

  const componentOriginals = item._componentOriginals || {};
  const originalsByName = item._originalCaracteristicas || {};
  const updatedByName = Object.fromEntries(
    Object.entries(caracteristicas || {}).map(([id, v]) => [componentOriginals[id]?.name || id, v ?? ''])
  );
  const tipologiaFromChange = calculateTipologia(originalsByName, updatedByName);

  const selectedVariant = item._selectedVariantId && item.variants?.length
    ? item.variants.find((v) => String(v.id) === String(item._selectedVariantId))
    : item.variants?.[0];

  const matchesCatalog = selectedVariant && itemMatchesSelectedVariantCatalog(item, caracteristicas);

  if (selectedVariant && matchesCatalog) {
    return {
      caracteristicas,
      type: 'p4',
      sapRef: selectedVariant.sapRef ?? null,
      sapCode: selectedVariant.sapCode ?? null,
    };
  }

  if (tipologiaFromChange === 'p1' || tipologiaFromChange === 'p2') {
    return {
      caracteristicas,
      type: tipologiaFromChange,
      sapRef: selectedVariant?.sapRef ?? item.sapRef ?? null,
      sapCode: selectedVariant?.sapCode ?? item.sapCode ?? null,
    };
  }

  if (!selectedVariant) {
    const hasVals = Object.values(caracteristicas || {}).some((x) => String(x ?? '').trim() !== '');
    if (hasVals) {
      return { caracteristicas, type: 'p3', sapRef: null, sapCode: null };
    }
  }

  if (selectedVariant) {
    return {
      caracteristicas,
      type: 'p1',
      sapRef: selectedVariant.sapRef ?? null,
      sapCode: selectedVariant.sapCode ?? null,
    };
  }

  return { caracteristicas };
}
