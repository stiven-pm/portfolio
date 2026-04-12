import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  FileInput,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import AutocompleteInput from '../../components/AutocompleteInput';
import FilterChipGroup from '../../components/filters/FilterChipGroup';
import {
  CATALOG_FILTER_ORDER,
  CATALOG_FILTER_PARENT,
  CATALOG_VARIANT_SCOPE_OPTIONS,
} from '../../constants/catalogFilters';
import { VARIANT_SCOPE, VARIANT_SCOPE_LABEL } from '../../constants/variantScope';
import './P3.css';

export default function ComercialP3() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addCustomProduct } = useCart();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    variantScope: VARIANT_SCOPE.LINE,
    categoria: null,
    subcategoria: null,
    linea: null,
  });
  const [cart, setCart] = useState([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');

  const productsInVariantScope = useMemo(() => {
    const want = filters.variantScope || VARIANT_SCOPE.LINE;
    return products.filter((p) =>
      (p.variants || []).some(
        (v) => String(v?.variantScope || VARIANT_SCOPE.LINE) === String(want)
      )
    );
  }, [products, filters.variantScope]);

  const filteredProducts = useMemo(() => {
    return productsInVariantScope.filter((p) => {
      if (filters.categoria && p.category !== filters.categoria) return false;
      if (filters.subcategoria && p.subcategory !== filters.subcategoria) return false;
      if (filters.linea && p.line !== filters.linea) return false;
      return true;
    });
  }, [productsInVariantScope, filters]);

  const baseOptions = useMemo(() => {
    const cat = [...new Set(productsInVariantScope.map((p) => p.category).filter(Boolean))].sort();
    const sub = filters.categoria
      ? [
          ...new Set(
            productsInVariantScope
              .filter((p) => p.category === filters.categoria)
              .map((p) => p.subcategory)
              .filter(Boolean)
          ),
        ].sort()
      : [];
    const lin =
      filters.categoria && filters.subcategoria
        ? [...new Set(filteredProducts.map((p) => p.line).filter(Boolean))].sort()
        : [];
    return { categorias: cat, subcategorias: sub, lineas: lin };
  }, [productsInVariantScope, filters.categoria, filters.subcategoria, filteredProducts]);

  const productsForVariables = useMemo(() => {
    if (!filters.categoria || !filters.subcategoria) return [];
    const hasLineas = (baseOptions.lineas || []).length > 0;
    if (hasLineas && !filters.linea) return [];
    return filteredProducts;
  }, [filters, filteredProducts, baseOptions]);

  const filteredVariables = useMemo(() => {
    const want = filters.variantScope || VARIANT_SCOPE.LINE;
    const map = {};
    productsForVariables.forEach((p) => {
      p.variants?.forEach((v) => {
        if (String(v?.variantScope || VARIANT_SCOPE.LINE) !== String(want)) return;
        v.components?.forEach((c) => {
          if (c?.name) {
            if (!map[c.name]) map[c.name] = new Set();
            if (c.value != null && String(c.value).trim()) map[c.name].add(String(c.value).trim());
          }
        });
      });
    });
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, [...v].sort()])
    );
  }, [productsForVariables, filters.variantScope]);

  const allVariableNames = useMemo(() => {
    const s = new Set();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        v.components?.forEach((c) => {
          if (c?.name) s.add(c.name);
        });
      });
    });
    return [...s].sort();
  }, [products]);

  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'variantScope') {
        next.variantScope = value != null ? value : VARIANT_SCOPE.LINE;
        next.categoria = null;
        next.subcategoria = null;
        next.linea = null;
      } else if (key === 'categoria') {
        next.categoria = value;
        next.subcategoria = null;
        next.linea = null;
      } else if (key === 'subcategoria') {
        next.subcategoria = value;
        next.linea = null;
      } else if (key === 'linea') {
        next.linea = value;
      }
      return next;
    });
  };

  const clearFilters = () =>
    setFilters({
      variantScope: VARIANT_SCOPE.LINE,
      categoria: null,
      subcategoria: null,
      linea: null,
    });

  const addToCart = (variableName, value) => {
    const name = (variableName || '').trim();
    const v = (value || '').trim();
    if (!name) return;
    setCart((prev) => {
      const without = prev.filter((c) => c.variableName !== name);
      return [...without, { variableName: name, variableValue: v || null }];
    });
    setNewVarName('');
    setNewVarValue('');
  };

  const removeFromCart = (variableName) => {
    setCart((prev) => prev.filter((c) => c.variableName !== variableName));
  };

  const handleAddNewVariable = () => {
    if (!newVarName?.trim()) {
      setMessage('El nombre de la variable es obligatorio');
      return;
    }
    addToCart(newVarName, newVarValue);
    setMessage('');
  };

  const handleAddToProject = () => {
    if (cart.length === 0 && !comentarios?.trim()) {
      setMessage('Agrega al menos una variable o un comentario');
      return;
    }
    setMessage('');
    const caracteristicas = cart.reduce((acc, c) => {
      acc[c.variableName] = c.variableValue || '';
      return acc;
    }, {});
    const item = {
      id: `p3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      code: `P3-${Date.now().toString().slice(-6)}`,
      name: 'P3 Custom',
      caracteristicas,
      comentarios: comentarios?.trim() || '',
      imageFile,
      quantity: 1,
      p3: true,
      tipologia: 'P3',
    };
    addCustomProduct(item);
    setCart([]);
    setComentarios('');
    setImageFile(null);
    navigate('/comercial/proyecto');
  };

  const hasFilters =
    filters.categoria ||
    filters.subcategoria ||
    filters.linea ||
    filters.variantScope === VARIANT_SCOPE.SPECIAL;
  const variableEntries = Object.entries(filteredVariables).filter(([, v]) => v?.length > 0);

  return (
    <div className="p3-page">
      <Button
        type="button"
        variant="filled"
        color="brand"
        size="sm"
        fullWidth
        className="p3-filters-toggle"
        onClick={() => setFiltersOpen(true)}
        aria-label="Abrir filtros"
        rightSection={
          hasFilters ? (
            <Badge size="xs" circle color="red" variant="filled" aria-hidden />
          ) : null
        }
      >
        Filtros
      </Button>

      <div className="p3-layout">
        <aside className={`p3-filters ${filtersOpen ? 'p3-filters-open' : ''}`}>
          <div className="p3-filters-header">
            <span>Filtros</span>
            <Button
              type="button"
              variant="subtle"
              color="gray"
              size="xs"
              className="p3-filters-close"
              onClick={() => setFiltersOpen(false)}
              aria-label="Cerrar filtros"
            >
              ✕
            </Button>
          </div>
          <Stack gap="md" className="p3-filter-panel">
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs" className="p3-filter-panel-header">
              <Title order={4} className="p3-filters-heading-desktop">
                Filtros
              </Title>
              <Button type="button" variant="light" color="gray" size="xs" className="p3-filter-clear" onClick={clearFilters}>
                Limpiar
              </Button>
            </Group>
            {CATALOG_FILTER_ORDER.map((key) => {
              const parent = CATALOG_FILTER_PARENT[key];
              if (parent && !filters[parent]) return null;
              if (key === 'variantScope') {
                return (
                  <div key={key} className="p3-filter-section">
                    <Text size="xs" fw={600} mb={6}>
                      Línea o especiales
                    </Text>
                    <FilterChipGroup
                      options={CATALOG_VARIANT_SCOPE_OPTIONS}
                      value={filters.variantScope}
                      labelForOption={(o) => VARIANT_SCOPE_LABEL[o] || o}
                      onSelect={(v) => setFilter('variantScope', v)}
                    />
                  </div>
                );
              }
              const opts = baseOptions[key === 'categoria' ? 'categorias' : key === 'subcategoria' ? 'subcategorias' : 'lineas'] || [];
              if (opts.length === 0) return null;
              const label = { categoria: 'Categoría', subcategoria: 'Subcategoría', linea: 'Línea' }[key];
              return (
                <div key={key} className="p3-filter-section">
                  <Text size="xs" fw={600} mb={6}>
                    {label}
                  </Text>
                  <FilterChipGroup options={opts} value={filters[key]} onSelect={(v) => setFilter(key, v)} />
                </div>
              );
            })}
          </Stack>
        </aside>
        <button
          type="button"
          className="p3-filters-backdrop"
          aria-hidden={!filtersOpen}
          onClick={() => setFiltersOpen(false)}
        />

        <main className="p3-main">
          <Paper withBorder shadow="xs" p="md" radius="md" className="p3-card">
            <Title order={3} className="p3-card-header" mb="md">
              Variables (filtradas)
            </Title>

            {!filters.categoria ? (
              <Text size="sm" c="dimmed" className="p3-hint">
                Pulsa <strong>Filtros</strong> y elige categoría para ver variables aquí.
              </Text>
            ) : !filters.subcategoria ? (
              <Text size="sm" c="dimmed" className="p3-hint">
                Selecciona subcategoría.
              </Text>
            ) : !filters.linea ? (
              <Text size="sm" c="dimmed" className="p3-hint">
                Selecciona línea para ver variables.
              </Text>
            ) : variableEntries.length === 0 ? (
              <Text size="sm" c="dimmed" className="p3-hint">
                No hay variables en los productos filtrados. Crea una nueva abajo.
              </Text>
            ) : (
              <Stack gap="md" className="p3-variables-grid">
                {variableEntries.map(([name, values]) => (
                  <div key={name} className="p3-variable-group">
                    <Text size="sm" fw={600} mb={6} className="p3-comp-label">
                      {name}
                    </Text>
                    <Group gap={6} wrap="wrap" className="p3-value-chips">
                      {values.map((val) => {
                        const inCart = cart.some((c) => c.variableName === name && c.variableValue === val);
                        return (
                          <Button
                            key={val}
                            type="button"
                            size="xs"
                            variant={inCart ? 'filled' : 'light'}
                            color={inCart ? 'brand' : 'gray'}
                            onClick={() => addToCart(name, val)}
                          >
                            {val}
                          </Button>
                        );
                      })}
                    </Group>
                  </div>
                ))}
              </Stack>
            )}

            <Stack gap="sm" mt="lg" className="p3-section p3-new-comp">
              <Text size="sm" fw={600}>
                Añadir variable nueva
              </Text>
              <Group wrap="wrap" align="flex-end" className="p3-new-comp-row">
                <AutocompleteInput
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  options={allVariableNames}
                  placeholder="Nombre"
                />
                <TextInput
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="Valor"
                  className="p3-new-value-input"
                  size="sm"
                />
                <Button type="button" size="sm" onClick={handleAddNewVariable}>
                  + Añadir
                </Button>
              </Group>
            </Stack>
          </Paper>

          {message ? (
            <Alert color="red" variant="light" className="p3-message" onClose={() => setMessage('')} withCloseButton mt="md">
              {message}
            </Alert>
          ) : null}
        </main>

        <aside className="p3-left">
          <Paper withBorder shadow="xs" p="md" radius="md" className="p3-cart-card">
            <Title order={4} mb="md">
              Variables de la variante
            </Title>
            {cart.length === 0 ? (
              <Text size="sm" c="dimmed" className="p3-hint">
                Marca variables en el centro para añadirlas.
              </Text>
            ) : (
              <Stack gap="xs" className="p3-cart-list">
                {cart.map((c) => (
                  <Group key={c.variableName} className="p3-cart-item" justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm">
                      {c.variableName}: {c.variableValue || '(vacío)'}
                    </Text>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      radius="md"
                      aria-label="Quitar"
                      onClick={() => removeFromCart(c.variableName)}
                    >
                      ×
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            )}
            <div className="p3-section">
              <FileInput
                label="Imagen"
                accept="image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif"
                placeholder="Archivo imagen"
                value={imageFile}
                onChange={setImageFile}
                clearable
                size="sm"
              />
            </div>
            <div className="p3-section">
              <Textarea
                label="Comentario"
                placeholder="Especificaciones, notas..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={3}
                size="sm"
              />
            </div>
            <Group justify="flex-end" gap="sm" className="p3-actions" mt="md">
              <Button type="button" variant="default" onClick={() => navigate('/comercial/proyecto')}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddToProject}>
                Añadir al proyecto
              </Button>
            </Group>
          </Paper>
        </aside>
      </div>
    </div>
  );
}
