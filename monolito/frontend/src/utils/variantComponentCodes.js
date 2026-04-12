/**
 * Códigos mostrados para variantes y filas de variable (refs de variante en catálogo).
 */

export function getVariantDisplayCodes({ sapRef, sapCode, type }) {
  const t = String(type || '').toLowerCase();
  if ((t === 'p3' || t === 'p5') && !sapRef && !sapCode) return null;
  if (!sapRef && !sapCode) return null;
  if (t === 'p1' || t === 'p2') {
    return { primary: sapRef || null, secondary: null };
  }
  if (sapRef && sapCode) return { primary: sapRef, secondary: sapCode };
  if (sapRef) return { primary: sapRef, secondary: null };
  if (sapCode) return { primary: sapCode, secondary: null };
  return null;
}

/** Códigos de una variable (refs almacenadas; sin validación extra). */
export function getVariableDisplayCodes({ sapRef, sapCode }) {
  if (!sapRef && !sapCode) return null;
  if (sapRef && sapCode) return { primary: sapRef, secondary: sapCode };
  if (sapRef) return { primary: sapRef, secondary: null };
  if (sapCode) return { primary: sapCode, secondary: null };
  return null;
}

/** @deprecated usar getVariableDisplayCodes */
export const getComponentDisplayCodes = getVariableDisplayCodes;

export function formatCodes(primary, secondary) {
  if (!primary) return '';
  if (secondary != null && String(secondary) !== '') {
    return `${primary} · ${secondary}`;
  }
  return primary;
}
