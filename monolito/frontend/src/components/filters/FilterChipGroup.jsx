import { Group, Button } from '@mantine/core';

/** Chips de filtro reutilizables (catálogo, P3, etc.). */
export default function FilterChipGroup({
  options = [],
  value,
  onSelect,
  size = 'xs',
  colorActive = 'brand',
  /** Si se pasa, texto del botón por valor (p. ej. LINE → «Línea»). */
  labelForOption,
}) {
  return (
    <Group gap={6} wrap="wrap" className="filter-chip-group">
      {options.map((opt) => {
        const active = value === opt;
        const label = labelForOption ? labelForOption(opt) : opt;
        return (
          <Button
            key={opt}
            type="button"
            size={size}
            variant={active ? 'filled' : 'light'}
            color={active ? colorActive : 'gray'}
            onClick={() => onSelect(active ? null : opt)}
          >
            {label}
          </Button>
        );
      })}
    </Group>
  );
}
