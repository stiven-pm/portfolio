import { useCallback, useEffect, useState } from 'react';
import { emptyVariable } from '../utils/variablePayload';
import { useFormDraftStorage } from '../context/FormDraftStorageContext';
import { VARIANT_SCOPE } from '../constants/variantScope';

const DRAFT_VERSION = 7;

function normalizeLoadedVariant(v) {
  if (!v) return null;
  const rawRows = v.variables || v.components || [];
  const variables =
    rawRows.length > 0
      ? rawRows.map((c) => ({
          variableId: c.variableId ?? c.componentId ?? null,
          variableDefinitionId: c.variableDefinitionId ?? null,
          variableName: c.variableName ?? c.componentName ?? c.name ?? '',
          variableValue: c.variableValue ?? c.componentValue ?? c.value ?? '',
          locked: c.locked ?? c.componentEditable === false,
          listOnly: c.listOnly ?? c.componentListOnly === true,
        }))
      : [emptyVariable()];
  return {
    sapRef: v.sapRef || '',
    imageFile: null,
    modelFile: null,
    image: v.image && String(v.image).trim() ? String(v.image).trim() : null,
    model: v.model && String(v.model).trim() ? String(v.model).trim() : null,
    variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
    variables,
  };
}

function normalizePendingSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const vars = raw.variables;
  const variables =
    Array.isArray(vars) && vars.length > 0
      ? vars.map((c) => ({
          variableId: c.variableId ?? c.componentId ?? null,
          variableDefinitionId: c.variableDefinitionId ?? null,
          variableName: c.variableName ?? c.componentName ?? c.name ?? '',
          variableValue: c.variableValue ?? c.componentValue ?? c.value ?? '',
          locked: !!c.locked,
          listOnly: !!c.listOnly,
        }))
      : [];
  const sapRef = String(raw.sapRef ?? '').trim();
  if (!sapRef && variables.length === 0) return null;
  const variantScope =
    raw.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE;
  return { sapRef, variantScope, variables };
}

function pendingHasContent(p) {
  if (!p) return false;
  if (String(p.sapRef ?? '').trim()) return true;
  return (p.variables || []).some(
    (row) =>
      row.variableName?.trim() ||
      row.variableValue?.trim() ||
      row.variableId ||
      row.variableDefinitionId ||
      row.listOnly ||
      row.locked
  );
}

const defaultForm = () => ({
  name: '',
  categoryId: '',
  subcategoryId: '',
  lineId: '',
});

export function useProductCreateDraft() {
  const { userId, readJson, writeJson, remove, keys } = useFormDraftStorage();
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(() => {
    if (!userId) return { form: defaultForm(), variants: [] };
    try {
      const p = readJson(keys.PRODUCT_CREATE);
      if (!p?.form) return { form: defaultForm(), variants: [] };
      const variants = Array.isArray(p.variants)
        ? p.variants.map(normalizeLoadedVariant).filter(Boolean)
        : [];
      const {
        category: _legacyCat,
        subcategory: _legacySub,
        line: _legacyLine,
        code: _legacyCode,
        space: _s,
        baseMaterial: _b,
        ...formRest
      } = p.form || {};
      return {
        form: { ...defaultForm(), ...formRest },
        variants,
      };
    } catch {
      return { form: defaultForm(), variants: [] };
    }
  }, [userId, readJson, keys.PRODUCT_CREATE]);

  const [form, setForm] = useState(defaultForm);
  const [initialVariants, setInitialVariants] = useState([]);

  useEffect(() => {
    if (!userId) {
      setForm(defaultForm());
      setInitialVariants([]);
      setHydrated(true);
      return;
    }
    const { form: f, variants: v } = load();
    setForm(f);
    setInitialVariants(v);
    setHydrated(true);
  }, [userId, load]);

  const persist = useCallback(
    (nextForm, nextVariants, pendingExplicit) => {
      if (!userId || !hydrated) return;
      const prev = readJson(keys.PRODUCT_CREATE) || {};
      const pendingVariant =
        pendingExplicit === undefined ? (prev.pendingVariant ?? null) : pendingExplicit;
      try {
        writeJson(keys.PRODUCT_CREATE, {
          v: DRAFT_VERSION,
          form: nextForm,
          variants: (nextVariants || []).map((variant) => ({
            sapRef: variant.sapRef ?? '',
            image: variant.image && String(variant.image).trim() ? String(variant.image).trim() : null,
            model: variant.model && String(variant.model).trim() ? String(variant.model).trim() : null,
            variantScope:
              variant.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
            variables: (variant.variables ?? variant.components ?? []).map((row) => ({
              variableId: row.variableId ?? row.componentId ?? null,
              variableDefinitionId: row.variableDefinitionId ?? null,
              variableName: row.variableName ?? row.componentName ?? row.name ?? '',
              variableValue: row.variableValue ?? row.componentValue ?? row.value ?? '',
              locked: !!row.locked,
              listOnly: !!row.listOnly,
            })),
          })),
          pendingVariant,
        });
      } catch {
        /* ignore */
      }
    },
    [userId, hydrated, readJson, writeJson, keys.PRODUCT_CREATE]
  );

  const clearStorage = useCallback(() => {
    if (userId) remove(keys.PRODUCT_CREATE);
  }, [userId, remove, keys.PRODUCT_CREATE]);

  /** Lee borrador de variante (modal sin confirmar) y lo quita del disco para no duplicar al abrir otra vez. */
  const takePendingVariantForNewModal = useCallback(() => {
    if (!userId) return null;
    const p = readJson(keys.PRODUCT_CREATE);
    if (!p?.form) return null;
    const snap = normalizePendingSnapshot(p?.pendingVariant);
    if (!pendingHasContent(snap)) return null;
    try {
      writeJson(keys.PRODUCT_CREATE, { ...p, pendingVariant: null });
    } catch {
      /* ignore */
    }
    return snap;
  }, [userId, readJson, writeJson, keys.PRODUCT_CREATE]);

  return {
    hydrated,
    form,
    setForm,
    initialVariants,
    setInitialVariants,
    persist,
    clearStorage,
    takePendingVariantForNewModal,
  };
}
