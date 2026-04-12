import { Button } from '@mantine/core';
import DynamicFilterPanel from '../DynamicFilterPanel';

/**
 * Shell común: toggle filtros móvil, panel lateral, backdrop y área de listados por categoría.
 */
export default function ProductosCatalogLayout({
  filtersOpen,
  onOpenFilters,
  onCloseFilters,
  children,
}) {
  return (
    <div className="productos-page">
      <Button
        type="button"
        variant="filled"
        color="brand"
        size="sm"
        fullWidth
        className="productos-filters-toggle"
        onClick={onOpenFilters}
        aria-label="Abrir filtros"
      >
        Filtros
      </Button>
      <div className="productos-layout">
        <aside className={`productos-filters ${filtersOpen ? 'productos-filters-open' : ''}`}>
          <div className="productos-filters-header">
            <span>Filtros</span>
            <Button
              type="button"
              variant="subtle"
              color="gray"
              size="xs"
              className="productos-filters-close"
              onClick={onCloseFilters}
              aria-label="Cerrar filtros"
            >
              ✕
            </Button>
          </div>
          <DynamicFilterPanel />
        </aside>
        <button
          type="button"
          className="productos-filters-backdrop"
          aria-hidden={!filtersOpen}
          onClick={onCloseFilters}
        />
        <section className="productos-content">{children}</section>
      </div>
    </div>
  );
}
