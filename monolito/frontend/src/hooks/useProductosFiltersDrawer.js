import { useState, useCallback } from 'react';

/** Estado del drawer de filtros en catálogo comercial / diseñador. */
export function useProductosFiltersDrawer(initialOpen = false) {
  const [filtersOpen, setFiltersOpen] = useState(initialOpen);
  const open = useCallback(() => setFiltersOpen(true), []);
  const close = useCallback(() => setFiltersOpen(false), []);
  return { filtersOpen, open, close, setFiltersOpen };
}
