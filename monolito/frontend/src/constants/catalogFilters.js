import { VARIANT_SCOPE } from './variantScope';

/** Orden de filtros en catálogo (Productos) y P3: primero línea vs especiales */
export const CATALOG_FILTER_ORDER = ['variantScope', 'categoria', 'subcategoria', 'linea'];

export const CATALOG_FILTER_PARENT = {
  categoria: 'variantScope',
  subcategoria: 'categoria',
  linea: 'subcategoria',
};

/** Valores fijos del primer filtro (no dependen del catálogo). */
export const CATALOG_VARIANT_SCOPE_OPTIONS = [VARIANT_SCOPE.LINE, VARIANT_SCOPE.SPECIAL];
