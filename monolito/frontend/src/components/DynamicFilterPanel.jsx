import { Stack, Text, Button, Divider, Group } from '@mantine/core';
import { useFilters } from '../context/FiltersContext';
import {
  CATALOG_FILTER_ORDER,
  CATALOG_FILTER_PARENT,
  CATALOG_VARIANT_SCOPE_OPTIONS,
} from '../constants/catalogFilters';
import { VARIANT_SCOPE_LABEL } from '../constants/variantScope';
import FilterChipGroup from './filters/FilterChipGroup';
import './DynamicFilterPanel.css';

export default function DynamicFilterPanel() {
  const {
    baseOptions,
    dynamicOptions,
    selectedFilters,
    setFilter,
    setVariableFilter,
    clearFilters,
  } = useFilters();

  const keyToLabel = {
    variantScope: 'Línea o especiales',
    categoria: 'Categoría',
    subcategoria: 'Subcategoría',
    linea: 'Línea',
  };

  const keyToOptions = {
    categoria: baseOptions.categorias,
    subcategoria: baseOptions.subcategorias,
    linea: baseOptions.lineas,
  };

  const isSectionVisible = (key) => {
    const parent = CATALOG_FILTER_PARENT[key];
    if (!parent) return true;
    return !!selectedFilters[parent];
  };

  const showVariableFilters = !!selectedFilters.linea;

  return (
    <Stack gap="md" className="filter-panel">
      <Group justify="space-between" align="center" wrap="nowrap" gap="md" className="filter-panel-header">
        <Text fw={600} size="md" className="filter-title">
          Filtros
        </Text>
        <Button type="button" variant="light" color="gray" size="sm" onClick={clearFilters} className="filter-clear-btn">
          Limpiar
        </Button>
      </Group>

      {CATALOG_FILTER_ORDER.map((key) => {
        if (!isSectionVisible(key)) return null;
        if (key === 'variantScope') {
          return (
            <div key={key} className="filter-section">
              <Text size="xs" fw={600} mb={6} c="dimmed">
                {keyToLabel.variantScope}
              </Text>
              <FilterChipGroup
                options={CATALOG_VARIANT_SCOPE_OPTIONS}
                value={selectedFilters.variantScope}
                labelForOption={(o) => VARIANT_SCOPE_LABEL[o] || o}
                onSelect={(v) => setFilter('variantScope', v)}
              />
            </div>
          );
        }
        const options = keyToOptions[key] || [];
        if (options.length === 0) return null;
        const value = selectedFilters[key];
        return (
          <div key={key} className="filter-section">
            <Text size="xs" fw={600} mb={6} c="dimmed">
              {keyToLabel[key]}
            </Text>
            <FilterChipGroup
              options={options}
              value={value}
              onSelect={(v) => setFilter(key, v)}
            />
          </div>
        );
      })}

      {showVariableFilters && Object.keys(dynamicOptions || {}).length > 0 && (
        <>
          <Divider />
          <div className="filter-section filter-section-variables">
            <Text size="sm" fw={600} mb="xs" component="div">
              Variables
            </Text>
            {Object.entries(dynamicOptions).map(([name, values]) => {
              if (!values?.length) return null;
              return (
                <div key={name} className="filter-subsection">
                  <Text size="xs" mb={6}>
                    {name}
                  </Text>
                  <FilterChipGroup
                    options={values}
                    value={selectedFilters.variables?.[name] ?? null}
                    onSelect={(v) => setVariableFilter(name, v)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </Stack>
  );
}
