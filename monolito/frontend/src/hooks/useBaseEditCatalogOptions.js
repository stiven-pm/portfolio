import { useMemo } from 'react';

/** Opciones de nombres/valores de variables desde el catálogo (products). */
export function useBaseEditCatalogOptions(products) {
  const componentOptions = useMemo(() => {
    const byId = new Map();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (c?.id) {
            byId.set(c.id, {
              id: c.id,
              variableDefinitionId: c.variableDefinitionId ?? null,
              label: c.name || c.sapRef || c.id,
              sapRef: c.sapRef,
              sapCode: c.sapCode,
            });
          }
        });
      });
    });
    return [...byId.values()].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [products]);

  const { componentValuesByRef, allComponentValues } = useMemo(() => {
    const valuesByRef = {};
    const allValues = new Set();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          const ref = String(c.id || c.name || '').trim();
          if (ref) {
            if (!valuesByRef[ref]) valuesByRef[ref] = new Set();
            if (c.value != null && String(c.value).trim()) {
              valuesByRef[ref].add(String(c.value).trim());
              allValues.add(String(c.value).trim());
            }
          }
        });
      });
    });
    return {
      componentValuesByRef: Object.fromEntries(
        Object.entries(valuesByRef).map(([k, v]) => [k, [...v].sort()])
      ),
      allComponentValues: [...allValues].sort(),
    };
  }, [products]);

  return { componentOptions, componentValuesByRef, allComponentValues };
}
