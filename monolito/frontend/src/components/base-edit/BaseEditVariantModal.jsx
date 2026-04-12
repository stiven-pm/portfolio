import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  FileInput,
  Group,
  Input,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { getMediaUrls } from '../../api/documentService';
import {
  PREVIEWABLE_IMAGE_ACCEPT,
  PREVIEWABLE_MODEL_3D_ACCEPT,
  isGltfHttpUrl,
} from '../../constants/previewableMedia';
import { collectValuesForVariableName } from '../../utils/variableCatalogOptions';
import { isSafeHttpUrl } from '../../utils/safeUrl';
import AutocompleteInput from '../AutocompleteInput';
import { VARIANT_SCOPE, VARIANT_SCOPE_LABEL } from '../../constants/variantScope';
import './BaseEditVariantModal.css';

function buildModelViewerSrc(url) {
  if (!url || !isSafeHttpUrl(url) || !isGltfHttpUrl(url)) return null;
  return `${import.meta.env.BASE_URL}viewer.html?model=${encodeURIComponent(url)}`;
}

export default function BaseEditVariantModal({
  variantDialog,
  variantDraft,
  saving,
  products = [],
  componentOptions = [],
  onClose,
  onSaveNew,
  onSaveEdit,
  editDraftSetSap,
  editDraftSetFile,
  editDraftPatchComp,
  editDraftPatchCompNameValue,
  blurEditDraftComponentName,
  editDraftAddComp,
  editDraftRemoveComp,
  newDraftSetSap,
  newDraftSetFile,
  newDraftPatchComp,
  newDraftComponentSelect,
  newDraftAddComp,
  newDraftRemoveComp,
  newDraftPatchCompFlags,
  setVariantScope,
}) {
  const isEdit = variantDialog?.mode === 'edit' && variantDraft?.id;
  const isNew = variantDialog?.mode === 'new' && variantDraft && !variantDraft.id;

  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [resolvedModelUrl, setResolvedModelUrl] = useState(null);

  useEffect(() => {
    if (!isEdit || !variantDraft?.image) {
      setResolvedImageUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await getMediaUrls([variantDraft.image], 'image');
        if (!cancelled) setResolvedImageUrl(r.data?.[variantDraft.image] || null);
      } catch {
        if (!cancelled) setResolvedImageUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, variantDraft?.image]);

  useEffect(() => {
    if (!isEdit || !variantDraft?.model) {
      setResolvedModelUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await getMediaUrls([variantDraft.model], 'model');
        if (!cancelled) setResolvedModelUrl(r.data?.[variantDraft.model] || null);
      } catch {
        if (!cancelled) setResolvedModelUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, variantDraft?.model]);

  const blobImageUrl = useMemo(() => {
    if (variantDraft?.imageFile instanceof File) return URL.createObjectURL(variantDraft.imageFile);
    return null;
  }, [variantDraft?.imageFile]);

  useEffect(() => {
    return () => {
      if (blobImageUrl?.startsWith('blob:')) URL.revokeObjectURL(blobImageUrl);
    };
  }, [blobImageUrl]);

  const displayImageUrl = blobImageUrl || resolvedImageUrl;
  const modelViewerSrc = buildModelViewerSrc(resolvedModelUrl);

  const nameListId = 'base-edit-variant-var-names';

  const { valueSuggestionsByName, allValueSuggestions, variableNameSuggestions } = useMemo(() => {
    const byName = {};
    const allVals = new Set();
    for (const p of products || []) {
      for (const v of p.variants || []) {
        for (const c of v.components || []) {
          const n = (c.name || '').trim();
          const val = (c.value || '').trim();
          if (!n || !val) continue;
          if (!byName[n]) byName[n] = new Set();
          byName[n].add(val);
          allVals.add(val);
        }
      }
    }
    const suggestions = {};
    for (const [k, set] of Object.entries(byName)) {
      suggestions[k] = [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }
    return {
      valueSuggestionsByName: suggestions,
      allValueSuggestions: [...allVals].sort((a, b) => a.localeCompare(b, 'es')),
      variableNameSuggestions: Object.keys(suggestions).sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [products]);

  const mergedVariableNames = useMemo(() => {
    const s = new Set(variableNameSuggestions);
    for (const o of componentOptions || []) {
      const l = (o.label || '').trim();
      if (l) s.add(l);
    }
    for (const row of variantDraft?.components || []) {
      const n = ((row.name ?? row.componentName) || '').trim();
      if (n) s.add(n);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'es'));
  }, [variableNameSuggestions, componentOptions, variantDraft?.components]);

  const augmentedValueByName = useMemo(() => {
    const out = { ...valueSuggestionsByName };
    for (const row of variantDraft?.components || []) {
      const k = ((row.name ?? row.componentName) || '').trim();
      const v = ((row.value ?? row.componentValue) || '').trim();
      if (!k || !v) continue;
      const set = new Set(out[k] || []);
      set.add(v);
      out[k] = [...set].sort((a, b) => a.localeCompare(b, 'es'));
    }
    return out;
  }, [valueSuggestionsByName, variantDraft?.components]);

  const mergedAllValues = useMemo(() => {
    const s = new Set(allValueSuggestions);
    for (const row of variantDraft?.components || []) {
      const v = ((row.value ?? row.componentValue) || '').trim();
      if (v) s.add(v);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'es'));
  }, [allValueSuggestions, variantDraft?.components]);

  const resolveNewComponentDisplayName = useCallback(
    (c) => {
      if (c.componentId) {
        const o = componentOptions.find((x) => x.id === c.componentId);
        return (o?.label || '').trim();
      }
      return c.componentName || '';
    },
    [componentOptions]
  );

  const valueSuggestionsForRow = useCallback(
    (nameKey, rowValue) => {
      const fromName = nameKey && augmentedValueByName[nameKey] ? augmentedValueByName[nameKey] : [];
      const fromCatalog = nameKey ? collectValuesForVariableName(products, nameKey) : [];
      const merged = [...new Set([...fromName, ...fromCatalog, ...(rowValue ? [rowValue] : [])])].sort((a, b) =>
        a.localeCompare(b, 'es')
      );
      return merged.length ? merged : mergedAllValues;
    },
    [augmentedValueByName, mergedAllValues, products]
  );

  if (!variantDialog || !variantDraft) return null;

  const title = isEdit ? 'Editar variante' : 'Nueva variante';

  const renderEditVariableRow = (c, cIdx) => {
    const showListSelect = Boolean(c.listOnly);
    const nameKey = (c.name || '').trim();
    const suggestions = valueSuggestionsForRow(nameKey, (c.value || '').trim());
    const valueListId = `base-edit-val-sug-edit-${cIdx}`;
    const labelMt = cIdx === 0 ? 24 : 0;

    return (
      <Group key={c.id || `comp-${cIdx}`} gap="xs" align="flex-start" wrap="nowrap" className="base-edit-variant-var-row">
        <TextInput
          style={{ flex: 1, minWidth: 0 }}
          size="sm"
          label={cIdx === 0 ? 'Nombre variable' : undefined}
          placeholder="Nombre"
          value={c.name || ''}
          onChange={(e) => editDraftPatchCompNameValue(cIdx, 'name', e.target.value)}
          onBlur={() => blurEditDraftComponentName(cIdx)}
          list={nameListId}
          autoComplete="off"
        />
        {showListSelect ? (
          <Input.Wrapper
            style={{ flex: 1, minWidth: 0 }}
            size="sm"
            label={cIdx === 0 ? 'Valor (lista comercial)' : undefined}
            className="base-edit-valor-mantine-wrap"
          >
            <AutocompleteInput
              className="base-edit-valor-autocomplete"
              value={c.value || ''}
              onChange={(e) => editDraftPatchComp(cIdx, { value: e.target.value })}
              options={suggestions}
              placeholder="Sugerencias o texto libre"
            />
          </Input.Wrapper>
        ) : (
          <>
            <TextInput
              style={{ flex: 1, minWidth: 0 }}
              size="sm"
              label={cIdx === 0 ? 'Valor' : undefined}
              placeholder="Valor (ej: ROJO)"
              value={c.value || ''}
              onChange={(e) => editDraftPatchCompNameValue(cIdx, 'value', e.target.value)}
              list={valueListId}
              autoComplete="off"
            />
            <datalist id={valueListId}>
              {suggestions.slice(0, 40).map((sug) => (
                <option key={sug} value={sug} />
              ))}
            </datalist>
          </>
        )}
        <Stack gap={4} mt={labelMt} miw={112} style={{ flexShrink: 0 }}>
          <Switch
            size="sm"
            label="Solo lista"
            title="Solo afecta al comercial: elige de lista o escribe libre."
            checked={Boolean(c.listOnly)}
            onChange={(e) => editDraftPatchComp(cIdx, { listOnly: e.currentTarget.checked })}
          />
          <Switch
            size="sm"
            label="No editable comercial"
            title="Solo afecta al comercial: no podrá cambiar este valor."
            checked={c.editable === false}
            onChange={(e) => editDraftPatchComp(cIdx, { editable: !e.currentTarget.checked })}
          />
        </Stack>
        <ActionIcon
          type="button"
          variant="light"
          color="red"
          size="lg"
          radius="xl"
          mt={labelMt}
          aria-label="Quitar variable"
          className="base-edit-variant-remove-var-icon"
          onClick={() => editDraftRemoveComp(cIdx)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
          </svg>
        </ActionIcon>
      </Group>
    );
  };

  const renderNewVariableRow = (c, cIdx) => {
    const showListSelect = Boolean(c.listOnly);
    const displayName = resolveNewComponentDisplayName(c);
    const nameKey = c.componentId
      ? (componentOptions.find((x) => x.id === c.componentId)?.label || '').trim()
      : (c.componentName || '').trim();
    const suggestions = valueSuggestionsForRow(nameKey, (c.componentValue || '').trim());
    const valueListId = `base-edit-val-sug-new-${cIdx}`;
    const labelMt = cIdx === 0 ? 24 : 0;

    return (
      <Group key={`new-comp-${cIdx}`} gap="xs" align="flex-start" wrap="nowrap" className="base-edit-variant-var-row">
        <TextInput
          style={{ flex: 1, minWidth: 0 }}
          size="sm"
          label={cIdx === 0 ? 'Nombre variable' : undefined}
          placeholder="Nombre"
          value={displayName}
          onChange={(e) => {
            const v = e.target.value;
            newDraftPatchComp(cIdx, 'componentId', null);
            newDraftPatchComp(cIdx, 'componentName', v);
          }}
          onBlur={() => newDraftComponentSelect(cIdx, displayName)}
          list={nameListId}
          autoComplete="off"
        />
        {showListSelect ? (
          <Input.Wrapper
            style={{ flex: 1, minWidth: 0 }}
            size="sm"
            label={cIdx === 0 ? 'Valor (lista comercial)' : undefined}
            className="base-edit-valor-mantine-wrap"
          >
            <AutocompleteInput
              className="base-edit-valor-autocomplete"
              value={c.componentValue || ''}
              onChange={(e) => newDraftPatchComp(cIdx, 'componentValue', e.target.value)}
              options={suggestions}
              placeholder="Sugerencias o texto libre"
            />
          </Input.Wrapper>
        ) : (
          <>
            <TextInput
              style={{ flex: 1, minWidth: 0 }}
              size="sm"
              label={cIdx === 0 ? 'Valor' : undefined}
              placeholder="Valor (ej: ROJO)"
              value={c.componentValue || ''}
              onChange={(e) => newDraftPatchComp(cIdx, 'componentValue', e.target.value)}
              list={valueListId}
              autoComplete="off"
            />
            <datalist id={valueListId}>
              {suggestions.slice(0, 40).map((sug) => (
                <option key={sug} value={sug} />
              ))}
            </datalist>
          </>
        )}
        <Stack gap={4} mt={labelMt} miw={112} style={{ flexShrink: 0 }}>
          <Switch
            size="sm"
            label="Solo lista"
            title="Solo afecta al comercial: elige de lista o escribe libre."
            checked={Boolean(c.listOnly)}
            onChange={(e) => newDraftPatchCompFlags(cIdx, { listOnly: e.currentTarget.checked })}
          />
          <Switch
            size="sm"
            label="No editable comercial"
            title="Solo afecta al comercial: no podrá cambiar este valor."
            checked={c.editable === false}
            onChange={(e) => newDraftPatchCompFlags(cIdx, { editable: !e.currentTarget.checked })}
          />
        </Stack>
        <ActionIcon
          type="button"
          variant="light"
          color="red"
          size="lg"
          radius="xl"
          mt={labelMt}
          aria-label="Quitar variable"
          className="base-edit-variant-remove-var-icon"
          onClick={() => newDraftRemoveComp(cIdx)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
          </svg>
        </ActionIcon>
      </Group>
    );
  };

  return (
    <div className="base-edit-variant-modal-overlay" role="presentation">
      <div
        className="base-edit-variant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="base-edit-variant-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="base-edit-variant-modal-header">
          <h3 id="base-edit-variant-title">{title}</h3>
          <button type="button" className="base-edit-variant-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="base-edit-variant-modal-body">
          <datalist id={nameListId}>
            {mergedVariableNames.slice(0, 80).map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          {isEdit && (
            <Stack gap="md">
              <TextInput
                label="SAP o modelo"
                placeholder="SAP o modelo"
                required
                size="sm"
                value={variantDraft.sapRef || ''}
                onChange={(e) => editDraftSetSap(e.target.value)}
              />
              <Box>
                <Text size="sm" fw={600} mb={6}>
                  Tipo de variante
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { value: VARIANT_SCOPE.LINE, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.LINE] },
                    { value: VARIANT_SCOPE.SPECIAL, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.SPECIAL] },
                  ]}
                  value={variantDraft.variantScope || VARIANT_SCOPE.LINE}
                  onChange={(v) => setVariantScope?.(v)}
                />
              </Box>
              <Box>
                <Text size="sm" fw={600} mb="xs">
                  Archivos actuales
                </Text>
                <div className="base-edit-media-row">
                  <Paper withBorder p="sm" radius="md" className="base-edit-media-card">
                    <Text size="xs" c="dimmed" mb={6}>
                      Imagen
                    </Text>
                    {displayImageUrl ? (
                      <img src={displayImageUrl} alt="" className="base-edit-media-preview-img" />
                    ) : (
                      <Text size="xs" c="dimmed">
                        Sin imagen
                      </Text>
                    )}
                  </Paper>
                  <Paper withBorder p="sm" radius="md" className="base-edit-media-card">
                    <Text size="xs" c="dimmed" mb={6}>
                      Modelo 3D
                    </Text>
                    {modelViewerSrc ? (
                      <iframe title="Vista previa 3D" className="base-edit-media-iframe" src={modelViewerSrc} />
                    ) : variantDraft.model ? (
                      <div className="base-edit-media-model-fallback">3D</div>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Sin modelo
                      </Text>
                    )}
                  </Paper>
                </div>
              </Box>
              <Group grow align="flex-start">
                <FileInput
                  label="Reemplazar imagen"
                  placeholder="JPG, PNG, GIF"
                  accept={PREVIEWABLE_IMAGE_ACCEPT}
                  clearable
                  size="sm"
                  value={variantDraft.imageFile || null}
                  onChange={(f) => editDraftSetFile('imageFile', f)}
                />
                <FileInput
                  label="Reemplazar modelo"
                  placeholder="GLB, GLTF"
                  accept={PREVIEWABLE_MODEL_3D_ACCEPT}
                  clearable
                  size="sm"
                  value={variantDraft.modelFile || null}
                  onChange={(f) => editDraftSetFile('modelFile', f)}
                />
              </Group>
              <Text size="sm" c="dimmed" fw={600}>
                Variables
              </Text>
              <Stack gap="sm">{(variantDraft.components || []).map((c, cIdx) => renderEditVariableRow(c, cIdx))}</Stack>
              <Button type="button" variant="light" color="brand" onClick={editDraftAddComp}>
                + Variable
              </Button>
            </Stack>
          )}

          {isNew && (
            <Stack gap="md">
              <TextInput
                label="SAP o modelo"
                placeholder="SAP o modelo"
                required
                size="sm"
                value={variantDraft.sapRef || ''}
                onChange={(e) => newDraftSetSap(e.target.value)}
              />
              <Box>
                <Text size="sm" fw={600} mb={6}>
                  Tipo de variante
                </Text>
                <SegmentedControl
                  fullWidth
                  data={[
                    { value: VARIANT_SCOPE.LINE, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.LINE] },
                    { value: VARIANT_SCOPE.SPECIAL, label: VARIANT_SCOPE_LABEL[VARIANT_SCOPE.SPECIAL] },
                  ]}
                  value={variantDraft.variantScope || VARIANT_SCOPE.LINE}
                  onChange={(v) => setVariantScope?.(v)}
                />
              </Box>
              <Group grow align="flex-start">
                <FileInput
                  label="Imagen"
                  placeholder="JPG, PNG, GIF (obligatorio)"
                  accept={PREVIEWABLE_IMAGE_ACCEPT}
                  required
                  size="sm"
                  value={variantDraft.imageFile || null}
                  onChange={(f) => newDraftSetFile('imageFile', f)}
                />
                <FileInput
                  label="Modelo 3D"
                  placeholder="GLB, GLTF (obligatorio)"
                  accept={PREVIEWABLE_MODEL_3D_ACCEPT}
                  required
                  size="sm"
                  value={variantDraft.modelFile || null}
                  onChange={(f) => newDraftSetFile('modelFile', f)}
                />
              </Group>
              <Text size="sm" c="dimmed" fw={600}>
                Variables
              </Text>
              <Stack gap="sm">{(variantDraft.components || []).map((c, cIdx) => renderNewVariableRow(c, cIdx))}</Stack>
              <Button type="button" variant="light" color="brand" onClick={newDraftAddComp}>
                + Variable
              </Button>
            </Stack>
          )}
        </div>

        <div className="base-edit-variant-modal-footer">
          <Button type="button" variant="default" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          {isEdit && (
            <Button type="button" color="brand" onClick={onSaveEdit} loading={saving}>
              Guardar variante
            </Button>
          )}
          {isNew && (
            <Button type="button" color="brand" onClick={onSaveNew} loading={saving}>
              Agregar variante
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
