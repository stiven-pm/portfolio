import { useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  FileInput,
  Switch,
  ActionIcon,
  Text,
  Input,
  SegmentedControl,
} from '@mantine/core';
import { toUpperFormValue } from '../../utils/formText';
import { emptyVariable } from '../../utils/variablePayload';
import { collectValuesForVariableName } from '../../utils/variableCatalogOptions';
import AutocompleteInput from '../../components/AutocompleteInput';
import { PREVIEWABLE_IMAGE_ACCEPT, PREVIEWABLE_MODEL_3D_ACCEPT } from '../../constants/previewableMedia';
import { VARIANT_SCOPE, VARIANT_SCOPE_LABEL } from '../../constants/variantScope';
import './CrearVariantModal.css';

export default function CrearVariantModal({
  open,
  title,
  draft,
  setDraft,
  onClose,
  onConfirm,
  saving,
  confirmLabel = 'Guardar variante',
  products = [],
  valueSuggestionsByName = {},
  allValueSuggestions = [],
  variableNameSuggestions = [],
}) {
  const vars = draft?.variables || [];

  const nameListId = 'crear-variant-draft-var-names';

  const mergedVariableNames = useMemo(() => {
    const s = new Set(variableNameSuggestions || []);
    for (const row of vars) {
      const n = row.variableName?.trim();
      if (n) s.add(n);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'es'));
  }, [variableNameSuggestions, vars]);

  const augmentedValueByName = useMemo(() => {
    const out = { ...valueSuggestionsByName };
    for (const row of vars) {
      const k = row.variableName?.trim();
      if (!k) continue;
      const v = row.variableValue?.trim();
      if (!v) continue;
      const set = new Set(out[k] || []);
      set.add(v);
      out[k] = [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }
    return out;
  }, [valueSuggestionsByName, vars]);

  const mergedAllValues = useMemo(() => {
    const s = new Set(allValueSuggestions || []);
    for (const row of vars) {
      const v = row.variableValue?.trim();
      if (v) s.add(v);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'es'));
  }, [allValueSuggestions, vars]);

  const handleVariantChange = (field, value) => {
    const v = field === 'sapRef' ? toUpperFormValue(value) : value;
    setDraft((prev) => (prev ? { ...prev, [field]: v } : prev));
  };

  const handleVariantFiles = (field, file) => {
    setDraft((prev) => (prev ? { ...prev, [field]: file } : prev));
  };

  const handleVariableChange = (idx, field, raw) => {
    const upper = new Set(['variableName', 'variableValue']);
    const v = upper.has(field) ? toUpperFormValue(raw) : raw;
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            variables: prev.variables.map((row, j) =>
              j === idx ? { ...row, [field]: v } : row
            ),
          }
        : prev
    );
  };

  const addVariable = () => {
    setDraft((prev) =>
      prev ? { ...prev, variables: [...(prev.variables || []), emptyVariable()] } : prev
    );
  };

  const removeVariable = (idx) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            variables: prev.variables.filter((_, j) => j !== idx),
          }
        : prev
    );
  };

  if (!open || !draft) return null;

  return (
    <Modal
      opened={open}
      onClose={onClose}
      closeOnClickOutside={false}
      title={title}
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.45 }}
    >
      <Stack gap="md">
        <TextInput
          label="SAP o modelo"
          required
          value={draft.sapRef || ''}
          onChange={(e) => handleVariantChange('sapRef', e.target.value)}
          placeholder="Código SAP o referencia de modelo"
        />

        <div>
          <Text size="sm" fw={600} mb={6}>
            Tipo de variante
          </Text>
          <SegmentedControl
            fullWidth
            data={[
              { value: VARIANT_SCOPE.LINE, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.LINE] },
              { value: VARIANT_SCOPE.SPECIAL, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.SPECIAL] },
            ]}
            value={draft.variantScope || VARIANT_SCOPE.LINE}
            onChange={(v) => handleVariantChange('variantScope', v)}
          />
        </div>

        <Group grow>
          <FileInput
            label="Imagen"
            accept={PREVIEWABLE_IMAGE_ACCEPT}
            placeholder={draft.image && !draft.imageFile ? 'Reemplazar imagen…' : 'JPG, PNG, GIF'}
            value={draft.imageFile || null}
            onChange={(f) => handleVariantFiles('imageFile', f)}
          />
          <FileInput
            label="Modelo 3D"
            accept={PREVIEWABLE_MODEL_3D_ACCEPT}
            placeholder={draft.model && !draft.modelFile ? 'Reemplazar modelo…' : 'GLB o GLTF'}
            value={draft.modelFile || null}
            onChange={(f) => handleVariantFiles('modelFile', f)}
          />
        </Group>
        {(draft.image || draft.model) && (
          <Text size="xs" c="dimmed">
            En borrador: {draft.image ? 'imagen' : 'sin imagen'} · {draft.model ? 'modelo 3D' : 'sin modelo'}
            {draft.imageFile || draft.modelFile ? ' (se subirá de nuevo al guardar)' : ''}
          </Text>
        )}

        <Text size="sm" fw={600}>
          Variables
        </Text>

        <datalist id={nameListId}>
          {mergedVariableNames.slice(0, 80).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        {vars.map((row, idx) => {
          const nameKey = row.variableName?.trim();
          const fromName =
            nameKey && augmentedValueByName[nameKey] ? augmentedValueByName[nameKey] : [];
          const fromCatalog = nameKey ? collectValuesForVariableName(products, nameKey) : [];
          const merged = [...new Set([...fromName, ...fromCatalog, ...(row.variableValue ? [row.variableValue] : [])])].sort(
            (a, b) => a.localeCompare(b, 'es')
          );
          const suggestions = merged.length ? merged : mergedAllValues;
          const useListUi = !!row.listOnly;

          return (
            <Group key={idx} className="crear-variant-var-row" align="flex-start" wrap="nowrap" gap="xs">
              <TextInput
                style={{ flex: 1, minWidth: 0 }}
                size="sm"
                label={idx === 0 ? 'Nombre variable' : undefined}
                placeholder="Nombre"
                value={row.variableName ?? ''}
                onChange={(e) => handleVariableChange(idx, 'variableName', e.target.value)}
                list={nameListId}
              />
              {useListUi ? (
                <Input.Wrapper
                  style={{ flex: 1, minWidth: 0 }}
                  size="sm"
                  label={idx === 0 ? 'Valor (lista comercial)' : undefined}
                  classNames={{ root: 'crear-variant-valor-mantine-wrap' }}
                >
                  <AutocompleteInput
                    className="crear-variant-valor-autocomplete"
                    value={row.variableValue ?? ''}
                    onChange={(e) => handleVariableChange(idx, 'variableValue', e.target.value)}
                    options={suggestions}
                    placeholder="Sugerencias o texto libre"
                  />
                </Input.Wrapper>
              ) : (
                <TextInput
                  style={{ flex: 1, minWidth: 0 }}
                  size="sm"
                  label={idx === 0 ? 'Valor' : undefined}
                  placeholder="Valor (ej: ROJO)"
                  value={row.variableValue ?? ''}
                  onChange={(e) => handleVariableChange(idx, 'variableValue', e.target.value)}
                  list={`val-sug-${idx}`}
                />
              )}
              {!useListUi && (
                <datalist id={`val-sug-${idx}`}>
                  {(suggestions || []).slice(0, 40).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
              <Stack gap={4} mt={idx === 0 ? 24 : 0} style={{ minWidth: 112 }}>
                <Switch
                  label="Solo lista"
                  title="Solo afecta al comercial: elige de lista o escribe libre."
                  checked={!!row.listOnly}
                  onChange={(e) => handleVariableChange(idx, 'listOnly', e.currentTarget.checked)}
                  size="sm"
                />
                <Switch
                  label="No editable comercial"
                  title="Solo afecta al comercial: no podrá cambiar este valor."
                  checked={!!row.locked}
                  onChange={(e) => handleVariableChange(idx, 'locked', e.currentTarget.checked)}
                  size="sm"
                />
              </Stack>
              <ActionIcon
                className="crear-variant-remove-var"
                variant="light"
                color="red"
                size="lg"
                radius="xl"
                aria-label="Quitar variable"
                disabled={vars.length <= 1}
                onClick={() => removeVariable(idx)}
                mt={idx === 0 ? 24 : 0}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                </svg>
              </ActionIcon>
            </Group>
          );
        })}

        <Button type="button" variant="light" onClick={addVariable}>
          + Agregar variable
        </Button>

        <Group justify="flex-end" mt="md">
          <Button type="button" variant="default" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} loading={saving}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
