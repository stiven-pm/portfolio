import { createContext, useContext, useState, useMemo } from 'react';
import { useProducts } from './ProductsContext';
import { VARIANT_SCOPE } from '../constants/variantScope';

const FiltersContext = createContext(null);

export const useFilters = () => {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
};

const initialFilters = {
  variantScope: VARIANT_SCOPE.LINE,
  categoria: null,
  subcategoria: null,
  linea: null,
  /** nombre variable → valor seleccionado */
  variables: {},
};

export const FiltersProvider = ({ children }) => {
  const { products } = useProducts();
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);

  const productsInVariantScope = useMemo(() => {
    const want = selectedFilters.variantScope || VARIANT_SCOPE.LINE;
    return products.filter((p) =>
      (p.variants || []).some(
        (v) => String(v?.variantScope || VARIANT_SCOPE.LINE) === String(want)
      )
    );
  }, [products, selectedFilters.variantScope]);

  const baseOptions = useMemo(() => {
    const optsCat = [...new Set(productsInVariantScope.map((p) => p.category).filter(Boolean))].sort();
    const subSource = productsInVariantScope.filter(
      (p) => !selectedFilters.categoria || p.category === selectedFilters.categoria
    );
    const optsSub = [...new Set(subSource.map((p) => p.subcategory).filter(Boolean))].sort();
    const linSource = subSource.filter(
      (p) => !selectedFilters.subcategoria || p.subcategory === selectedFilters.subcategoria
    );
    const optsLin = [...new Set(linSource.map((p) => p.line).filter(Boolean))].sort();
    return { categorias: optsCat, subcategorias: optsSub, lineas: optsLin };
  }, [productsInVariantScope, selectedFilters.categoria, selectedFilters.subcategoria]);

  const dynamicOptions = useMemo(() => {
    const want = selectedFilters.variantScope || VARIANT_SCOPE.LINE;
    const list = productsInVariantScope.filter((p) => {
      if (selectedFilters.categoria && p.category !== selectedFilters.categoria) return false;
      if (selectedFilters.subcategoria && p.subcategory !== selectedFilters.subcategoria) return false;
      if (selectedFilters.linea && p.line !== selectedFilters.linea) return false;
      return true;
    });
    const map = {};
    list.forEach((p) => {
      p.variants?.forEach((v) => {
        if (String(v?.variantScope || VARIANT_SCOPE.LINE) !== String(want)) return;
        v.components?.forEach((c) => {
          if (!map[c.name]) map[c.name] = new Set();
          map[c.name].add(c.value);
        });
      });
    });
    return Object.keys(map).reduce((acc, k) => {
      acc[k] = [...map[k]].sort();
      return acc;
    }, {});
  }, [productsInVariantScope, selectedFilters]);

  const productsByCategory = useMemo(() => {
    const want = selectedFilters.variantScope || VARIANT_SCOPE.LINE;
    const filtered = productsInVariantScope.filter((p) => {
      if (selectedFilters.categoria && p.category !== selectedFilters.categoria) return false;
      if (selectedFilters.subcategoria && p.subcategory !== selectedFilters.subcategoria)
        return false;
      if (selectedFilters.linea && p.line !== selectedFilters.linea) return false;
      const varFilters = Object.entries(selectedFilters.variables || {});
      if (varFilters.length > 0) {
        return (p.variants || []).some(
          (v) =>
            String(v?.variantScope || VARIANT_SCOPE.LINE) === String(want) &&
            varFilters.every(([fName, fValue]) =>
              v.components?.some((c) => c.name === fName && c.value === fValue)
            )
        );
      }
      return true;
    });
    return filtered.reduce((acc, p) => {
      (acc[p.category] = acc[p.category] || []).push(p);
      return acc;
    }, {});
  }, [productsInVariantScope, selectedFilters]);

  const clearFilters = () => setSelectedFilters(initialFilters);

  const setFilter = (key, value) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      if (key === 'variantScope') {
        next.variantScope = value != null ? value : VARIANT_SCOPE.LINE;
        next.categoria = null;
        next.subcategoria = null;
        next.linea = null;
        next.variables = {};
      } else if (key === 'categoria') {
        next.categoria = value;
        next.subcategoria = null;
        next.linea = null;
        next.variables = {};
      } else if (key === 'subcategoria') {
        next.subcategoria = value;
        next.linea = null;
        next.variables = {};
      } else if (key === 'linea') {
        next.linea = value;
        next.variables = {};
      }
      return next;
    });
  };

  const setVariableFilter = (name, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [name]: value,
      },
    }));
  };

  return (
    <FiltersContext.Provider
      value={{
        baseOptions,
        dynamicOptions,
        selectedFilters,
        setSelectedFilters,
        setFilter,
        setVariableFilter,
        /** @deprecated usar setVariableFilter */
        setComponentFilter: setVariableFilter,
        productsByCategory,
        clearFilters,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};
