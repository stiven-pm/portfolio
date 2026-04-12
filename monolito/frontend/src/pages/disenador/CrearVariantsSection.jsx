import { Button, Group, Text } from '@mantine/core';
import './CrearVariantsSection.css';

function countVariables(v) {
  const rows = v.variables || v.components || [];
  return rows.filter(
    (c) =>
      c.variableName?.trim() ||
      c.variableValue?.trim() ||
      c.name?.trim() ||
      c.value?.trim() ||
      c.variableId ||
      c.componentId
  ).length;
}

export default function CrearVariantsSection({
  initialVariants,
  onOpenNew,
  onOpenEdit,
  onRemoveVariant,
  variantModalOpen = false,
}) {
  return (
    <fieldset className="crear-variant-section">
      <legend>Variantes</legend>
      {initialVariants.length === 0 ? (
        <div className="crear-variants-empty">
          <Text size="sm" c="dimmed">
            No hay variantes todavía. Creá la primera para este producto.
          </Text>
          <Button
            type="button"
            color="brand"
            className="crear-variants-primary"
            onClick={onOpenNew}
            disabled={variantModalOpen}
          >
            + Nueva variante
          </Button>
        </div>
      ) : (
        <>
          <ul className="crear-variant-list">
            {initialVariants.map((variant, vIdx) => (
              <li key={vIdx} className="crear-variant-list-item">
                <div className="crear-variant-list-main">
                  <strong className="crear-variant-list-title">Variante {vIdx + 1}</strong>
                  <span className="crear-variant-list-meta">
                    {variant.sapRef?.trim() ? `SAP/modelo: ${variant.sapRef}` : 'SAP/modelo pendiente'}
                  </span>
                  <span className="crear-variant-list-meta">{countVariables(variant)} variable(s)</span>
                </div>
                <Group gap="xs" wrap="nowrap" className="crear-variant-list-actions">
                  <Button
                    type="button"
                    size="xs"
                    variant="light"
                    color="brand"
                    onClick={() => onOpenEdit(vIdx)}
                    disabled={variantModalOpen}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="light"
                    color="red"
                    className="crear-variant-list-remove"
                    onClick={() => onRemoveVariant(vIdx)}
                    disabled={variantModalOpen}
                  >
                    Eliminar
                  </Button>
                </Group>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="default"
            className="crear-add-variant"
            onClick={onOpenNew}
            disabled={variantModalOpen}
          >
            + Agregar variante
          </Button>
        </>
      )}
    </fieldset>
  );
}
