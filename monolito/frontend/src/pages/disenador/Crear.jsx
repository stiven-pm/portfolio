import { useEffect, useMemo, useState } from 'react';
import { Paper, Stack, Button, Text } from '@mantine/core';
import { useProductsService } from '../../hooks/useProductsService';
import { useUser } from '../../context/UserContext';
import { useProducts } from '../../context/ProductsContext';
import { useProductCreateDraft } from '../../hooks/useProductCreateDraft';
import { uploadFile } from '../../api/documentService';
import { toUpperFormValue } from '../../utils/formText';
import { graphqlErrorUserMessage } from '../../utils/graphqlErrorUserMessage';
import {
  emptyVariable,
  variablesToGraphqlComponents,
  graphqlComponentsToVariables,
} from '../../utils/variablePayload';
import { VARIANT_SCOPE } from '../../constants/variantScope';
import CrearFormFields from './CrearFormFields';
import CrearVariantsSection from './CrearVariantsSection';
import CrearVariantModal from './CrearVariantModal';

const emptyVariant = () => ({
  sapRef: '',
  imageFile: null,
  modelFile: null,
  image: null,
  model: null,
  variantScope: VARIANT_SCOPE.LINE,
  variables: [emptyVariable()],
});

const UPPER_FORM = new Set(['name']);

function normalizeTaxonomyLabel(s) {
  return String(s ?? '').trim().toLocaleUpperCase('es-419');
}

function buildUniqueTaxonomyIndex(rows, getKey) {
  const map = new Map();
  const dup = new Set();
  for (const r of rows) {
    const k = normalizeTaxonomyLabel(getKey(r));
    if (!k) continue;
    if (dup.has(k)) continue;
    if (map.has(k)) {
      map.delete(k);
      dup.add(k);
      continue;
    }
    map.set(k, r);
  }
  return map;
}

export default function DisenadorCrear() {
  const productsService = useProductsService();
  const { user } = useUser();
  const { products, reload } = useProducts();
  const {
    hydrated,
    form,
    setForm,
    initialVariants,
    setInitialVariants,
    persist,
    clearStorage,
    takePendingVariantForNewModal,
  } = useProductCreateDraft();

  const [saving, setSaving] = useState(false);
  const [variantModalBusy, setVariantModalBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [variantModal, setVariantModal] = useState(null);
  const [variantDraft, setVariantDraft] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [lineInput, setLineInput] = useState('');

  const { valueSuggestionsByName, allValueSuggestions, variableNameSuggestions } = useMemo(() => {
    const byName = {};
    const allVals = new Set();
    const names = new Set();

    const ingestNameValue = (rawName, rawVal) => {
      const k = rawName?.trim();
      if (!k) return;
      names.add(k);
      if (!byName[k]) byName[k] = new Set();
      if (rawVal != null && String(rawVal).trim()) {
        const vv = String(rawVal).trim();
        byName[k].add(vv);
        allVals.add(vv);
      }
    };

    for (const p of products) {
      for (const v of p.variants || []) {
        for (const c of v.components || []) {
          ingestNameValue(c?.name, c?.value);
        }
      }
    }

    for (const variant of initialVariants) {
      const rows = variant.variables || variant.components || [];
      for (const c of rows) {
        const n = c.variableName ?? c.componentName ?? c.name;
        const val = c.variableValue ?? c.componentValue ?? c.value;
        ingestNameValue(n, val);
      }
    }

    return {
      valueSuggestionsByName: Object.fromEntries(
        Object.entries(byName).map(([k, s]) => [k, [...s].sort((a, b) => a.localeCompare(b, 'es'))])
      ),
      allValueSuggestions: [...allVals].sort((a, b) => a.localeCompare(b, 'es')),
      variableNameSuggestions: [...names].sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [products, initialVariants]);

  useEffect(() => {
    let cancelled = false;
    productsService.getProductCategories().then((rows) => {
      if (!cancelled) {
        setCategoryOptions(
          (rows || []).map((r) => ({ value: String(r.id), label: r.name || String(r.id) }))
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productsService]);

  useEffect(() => {
    // Recomendaciones globales (no dependientes). Los IDs reales se resuelven al confirmar (blur/submit).
    const sub = new Map();
    const lines = new Map();
    for (const p of products || []) {
      if (p?.subcategoryId && p?.subcategory) {
        const id = String(p.subcategoryId);
        if (!sub.has(id)) sub.set(id, { value: id, label: p.subcategory, categoryId: p.categoryId ? String(p.categoryId) : null });
      }
      if (p?.lineId && p?.line) {
        const id = String(p.lineId);
        if (!lines.has(id)) lines.set(id, { value: id, label: p.line, subcategoryId: p.subcategoryId ? String(p.subcategoryId) : null });
      }
    }
    setSubcategoryOptions(
      [...sub.values()]
        .sort((a, b) => String(a.label).localeCompare(String(b.label), 'es'))
        .map(({ value, label }) => ({ value, label }))
    );
    setLineOptions(
      [...lines.values()]
        .sort((a, b) => String(a.label).localeCompare(String(b.label), 'es'))
        .map(({ value, label }) => ({ value, label }))
    );
  }, [products]);

  const taxonomyIndexes = useMemo(() => {
    const subRows = [];
    const lineRows = [];
    const subIdToCategoryId = new Map();
    for (const p of products || []) {
      if (p?.subcategoryId && p?.subcategory) {
        const row = {
          id: String(p.subcategoryId),
          name: String(p.subcategory),
          categoryId: p?.categoryId ? String(p.categoryId) : null,
        };
        subRows.push(row);
        if (row.categoryId) subIdToCategoryId.set(row.id, row.categoryId);
      }
      if (p?.lineId && p?.line) {
        lineRows.push({
          id: String(p.lineId),
          name: String(p.line),
          subcategoryId: p?.subcategoryId ? String(p.subcategoryId) : null,
        });
      }
    }
    return {
      subByName: buildUniqueTaxonomyIndex(subRows, (r) => r.name),
      lineByName: buildUniqueTaxonomyIndex(lineRows, (r) => r.name),
      subIdToCategoryId,
    };
  }, [products]);

  useEffect(() => {
    if (!form.categoryId) {
      setCategoryInput('');
      return;
    }
    const o = categoryOptions.find((x) => x.value === String(form.categoryId));
    if (o) setCategoryInput(o.label);
  }, [form.categoryId, categoryOptions]);

  useEffect(() => {
    if (!form.subcategoryId) {
      setSubcategoryInput('');
      return;
    }
    const o = subcategoryOptions.find((x) => x.value === String(form.subcategoryId));
    if (o) setSubcategoryInput(o.label);
  }, [form.subcategoryId, subcategoryOptions]);

  useEffect(() => {
    if (!form.lineId) {
      setLineInput('');
      return;
    }
    const o = lineOptions.find((x) => x.value === String(form.lineId));
    if (o) setLineInput(o.label);
  }, [form.lineId, lineOptions]);

  const upsertCategoryOption = (row) => {
    if (!row?.id) return;
    const id = String(row.id);
    const label = row.name || id;
    setCategoryOptions((prev) => {
      const rest = prev.filter((p) => p.value !== id);
      rest.push({ value: id, label });
      return rest.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    });
  };

  const upsertSubcategoryOption = (row) => {
    if (!row?.id) return;
    const id = String(row.id);
    const label = row.name || id;
    setSubcategoryOptions((prev) => {
      const rest = prev.filter((p) => p.value !== id);
      rest.push({ value: id, label });
      return rest.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    });
  };

  const upsertLineOption = (row) => {
    if (!row?.id) return;
    const id = String(row.id);
    const label = row.name || id;
    setLineOptions((prev) => {
      const rest = prev.filter((p) => p.value !== id);
      rest.push({ value: id, label });
      return rest.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    });
  };

  const commitCategoryBlur = async (raw) => {
    const t = raw?.trim() ?? '';
    if (!t) {
      setForm((p) => ({ ...p, categoryId: '', subcategoryId: '', lineId: '' }));
      setCategoryInput('');
      setSubcategoryInput('');
      setLineInput('');
      return;
    }
    try {
      const row = await productsService.ensureProductCategory(t);
      upsertCategoryOption(row);
      setForm((p) => ({ ...p, categoryId: String(row.id), subcategoryId: '', lineId: '' }));
      setCategoryInput(row.name);
      setSubcategoryInput('');
      setLineInput('');
    } catch (err) {
      const { short } = graphqlErrorUserMessage(err);
      setMessage(short || 'No se pudo guardar la categoría');
    }
  };

  const commitSubcategoryBlur = async (raw) => {
    const t = raw?.trim() ?? '';
    if (!t) {
      setForm((p) => ({ ...p, subcategoryId: '', lineId: '' }));
      setSubcategoryInput('');
      setLineInput('');
      return;
    }
    try {
      let categoryId = form.categoryId?.trim() ? String(form.categoryId) : null;
      if (!categoryId) {
        const match = taxonomyIndexes.subByName.get(normalizeTaxonomyLabel(t));
        if (match?.categoryId) categoryId = String(match.categoryId);
      }
      if (!categoryId) {
        setMessage('Para confirmar una subcategoría, confirmá primero la categoría.');
        return;
      }
      const row = await productsService.ensureProductSubcategory(categoryId, t);
      upsertSubcategoryOption(row);
      setForm((p) => ({ ...p, categoryId, subcategoryId: String(row.id), lineId: '' }));
      setSubcategoryInput(row.name);
      setLineInput('');
    } catch (err) {
      const { short } = graphqlErrorUserMessage(err);
      setMessage(short || 'No se pudo guardar la subcategoría');
    }
  };

  const commitLineBlur = async (raw) => {
    const t = raw?.trim() ?? '';
    if (!t) {
      setForm((p) => ({ ...p, lineId: '' }));
      setLineInput('');
      return;
    }
    try {
      let subcategoryId = form.subcategoryId?.trim() ? String(form.subcategoryId) : null;
      if (!subcategoryId) {
        const match = taxonomyIndexes.lineByName.get(normalizeTaxonomyLabel(t));
        if (match?.subcategoryId) subcategoryId = String(match.subcategoryId);
      }
      if (!subcategoryId) {
        setMessage('Para confirmar una línea, confirmá primero la subcategoría.');
        return;
      }
      const row = await productsService.ensureProductLine(subcategoryId, t);
      upsertLineOption(row);
      const catFromSub = taxonomyIndexes.subIdToCategoryId.get(String(subcategoryId));
      setForm((p) => ({
        ...p,
        categoryId: p.categoryId || catFromSub || '',
        subcategoryId: p.subcategoryId || String(subcategoryId),
        lineId: String(row.id),
      }));
      setLineInput(row.name);
    } catch (err) {
      const { short } = graphqlErrorUserMessage(err);
      setMessage(short || 'No se pudo guardar la línea');
    }
  };

  const ensureTaxonomyForSubmit = async () => {
    const catIn = categoryInput.trim();
    const subIn = subcategoryInput.trim();
    const lineIn = lineInput.trim();
    if (!catIn || !subIn || !lineIn) {
      throw new Error('Completá categoría, subcategoría y línea.');
    }
    const cat = await productsService.ensureProductCategory(catIn);
    upsertCategoryOption(cat);
    const sub = await productsService.ensureProductSubcategory(String(cat.id), subIn);
    upsertSubcategoryOption(sub);
    const line = await productsService.ensureProductLine(String(sub.id), lineIn);
    upsertLineOption(line);
    const ids = {
      categoryId: String(cat.id),
      subcategoryId: String(sub.id),
      lineId: String(line.id),
    };
    setForm((f) => ({ ...f, ...ids }));
    setCategoryInput(cat.name);
    setSubcategoryInput(sub.name);
    setLineInput(line.name);
    return ids;
  };

  useEffect(() => {
    if (!hydrated) return;
    // pendingVariant en disco es solo para reanudar «Nueva variante»; nunca mezclar con edición de una ya guardada.
    const pendingExplicit =
      variantModal?.mode === 'new' && variantDraft
        ? { sapRef: variantDraft.sapRef ?? '', variables: variantDraft.variables ?? [] }
        : undefined;
    persist(form, initialVariants, pendingExplicit);
  }, [form, initialVariants, hydrated, persist, variantModal, variantDraft]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = UPPER_FORM.has(name) ? toUpperFormValue(value) : value;
    setForm((prev) => ({ ...prev, [name]: v }));
  };

  const onCategoryInputChange = (e) => {
    const v = e.target.value;
    setCategoryInput(v);
    const cur = categoryOptions.find((x) => x.value === String(form.categoryId));
    const same =
      cur && v.trim().toLowerCase() === String(cur.label ?? '').trim().toLowerCase();
    if (form.categoryId && !same) {
      setForm((p) => ({ ...p, categoryId: '', subcategoryId: '', lineId: '' }));
      setSubcategoryInput('');
      setLineInput('');
    }
  };

  const onSubcategoryInputChange = (e) => {
    const v = e.target.value;
    setSubcategoryInput(v);
    const cur = subcategoryOptions.find((x) => x.value === String(form.subcategoryId));
    const same =
      cur && v.trim().toLowerCase() === String(cur.label ?? '').trim().toLowerCase();
    if (form.subcategoryId && !same) {
      setForm((p) => ({ ...p, subcategoryId: '', lineId: '' }));
      setLineInput('');
    }
  };

  const onLineInputChange = (e) => {
    const v = e.target.value;
    setLineInput(v);
    const cur = lineOptions.find((x) => x.value === String(form.lineId));
    const same = cur && v.trim().toLowerCase() === String(cur.label ?? '').trim().toLowerCase();
    if (form.lineId && !same) {
      setForm((p) => ({ ...p, lineId: '' }));
    }
  };

  const openVariantNew = () => {
    setMessage('');
    const seed = takePendingVariantForNewModal();
    setVariantDraft(
      seed
        ? {
            sapRef: seed.sapRef || '',
            imageFile: null,
            modelFile: null,
            image: null,
            model: null,
            variantScope: seed.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
            variables:
              seed.variables?.length > 0
                ? seed.variables.map((row) => ({
                    ...emptyVariable(),
                    ...row,
                  }))
                : [emptyVariable()],
          }
        : emptyVariant()
    );
    setVariantModal({ mode: 'new' });
  };

  const openVariantEdit = (index) => {
    setMessage('');
    const v = initialVariants[index];
    if (!v) return;
    const rawVars =
      v.variables?.length > 0
        ? v.variables
        : graphqlComponentsToVariables(v.components || []);
    setVariantDraft({
      ...v,
      variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
      variables: rawVars.length ? rawVars.map((row) => ({ ...row })) : [emptyVariable()],
    });
    setVariantModal({ mode: 'edit', index });
  };

  const closeVariantModal = (opts) => {
    if (opts?.discard !== true && variantDraft && variantModal?.mode === 'new') {
      persist(form, initialVariants, {
        sapRef: variantDraft.sapRef ?? '',
        variantScope: variantDraft.variantScope ?? VARIANT_SCOPE.LINE,
        variables: variantDraft.variables ?? [],
      });
    }
    setVariantModal(null);
    setVariantDraft(null);
  };

  const confirmVariantModal = async () => {
    const d = variantDraft;
    if (!d || !variantModal) return;

    if (!String(d.sapRef ?? '').trim()) {
      setMessage('Indicá SAP o modelo de la variante.');
      return;
    }

    const varsFiltered = (d.variables || []).filter(
      (x) =>
        x.variableName?.trim() ||
        x.variableValue?.trim() ||
        x.variableId ||
        x.variableDefinitionId
    );
    if (varsFiltered.length === 0) {
      setMessage('La variante debe tener al menos una variable con nombre o valor.');
      return;
    }

    for (const row of varsFiltered) {
      if (row.listOnly) {
        const val = String(row.variableValue ?? '').trim();
        if (!val) {
          setMessage(`Variable "${row.variableName || '—'}": con «Solo lista» marcado, el valor es obligatorio.`);
          return;
        }
      }
    }

    setVariantModalBusy(true);
    setMessage('');
    try {
      let image = d.image && String(d.image).trim() ? String(d.image).trim() : null;
      let model = d.model && String(d.model).trim() ? String(d.model).trim() : null;
      if (d.imageFile) {
        const r = await uploadFile(d.imageFile, 'image');
        image = r?.key ?? image;
      }
      if (d.modelFile) {
        const r = await uploadFile(d.modelFile, 'model');
        model = r?.key ?? model;
      }

      const normalized = {
        ...d,
        variables: varsFiltered,
        image,
        model,
        variantScope: d.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
        imageFile: null,
        modelFile: null,
      };
      let nextList;
      if (variantModal.mode === 'new') {
        nextList = [...initialVariants, normalized];
      } else {
        const idx = variantModal.index;
        nextList = initialVariants.map((v, i) => (i === idx ? normalized : v));
      }
      persist(form, nextList, null);
      setInitialVariants(nextList);
      closeVariantModal({ discard: true });
    } catch (err) {
      setMessage(err?.message || 'Error al subir imagen o modelo');
    } finally {
      setVariantModalBusy(false);
    }
  };

  const removeVariant = (variantIdx) => {
    setInitialVariants((prev) => prev.filter((_, i) => i !== variantIdx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      if (!form.name?.trim()) {
        setMessage('Indicá el nombre del producto.');
        setSaving(false);
        return;
      }

      let taxonomyIds;
      try {
        taxonomyIds = await ensureTaxonomyForSubmit();
      } catch (err) {
        setMessage(err?.message || 'Revisá categoría, subcategoría y línea.');
        setSaving(false);
        return;
      }

      if (initialVariants.length === 0) {
        setMessage('Agregá al menos una variante (botón «Nueva variante»).');
        setSaving(false);
        return;
      }

      for (let i = 0; i < initialVariants.length; i++) {
        const v = initialVariants[i];
        if (!String(v.sapRef ?? '').trim()) {
          setMessage(`Variante ${i + 1}: falta SAP o modelo.`);
          setSaving(false);
          return;
        }
        const hasImg = v.imageFile || (v.image && String(v.image).trim());
        const hasMod = v.modelFile || (v.model && String(v.model).trim());
        if (!hasImg || !hasMod) {
          setMessage(`Variante ${i + 1}: imagen y modelo obligatorios (guardalos en la variante o subí archivos).`);
          setSaving(false);
          return;
        }
      }

      const variantsToSend = [];
      for (const v of initialVariants) {
        const components = variablesToGraphqlComponents(v.variables || []);
        if (components.length === 0) {
          setMessage('Cada variante debe tener al menos una variable.');
          setSaving(false);
          return;
        }
        let imageKey = v.image && String(v.image).trim() ? String(v.image).trim() : null;
        let modelKey = v.model && String(v.model).trim() ? String(v.model).trim() : null;
        if (v.imageFile) {
          const imgRes = await uploadFile(v.imageFile, 'image');
          imageKey = imgRes.key;
        }
        if (v.modelFile) {
          const modRes = await uploadFile(v.modelFile, 'model');
          modelKey = modRes.key;
        }
        variantsToSend.push({
          sapRef: v.sapRef.trim(),
          image: imageKey,
          model: modelKey,
          variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
          components,
        });
      }

      await productsService.createBase({
        name: form.name?.trim(),
        categoryId: taxonomyIds.categoryId,
        subcategoryId: taxonomyIds.subcategoryId,
        lineId: taxonomyIds.lineId,
        creatorId: user?.id,
        creatorName: user?.name,
        initialVariants: variantsToSend,
      });
      setMessage('Producto creado correctamente');
      setForm({
        name: '',
        categoryId: '',
        subcategoryId: '',
        lineId: '',
      });
      setCategoryInput('');
      setSubcategoryInput('');
      setLineInput('');
      setInitialVariants([]);
      clearStorage();
      reload();
    } catch (err) {
      const { short } = graphqlErrorUserMessage(err);
      setMessage(short || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const variantModalTitle =
    variantModal?.mode === 'edit'
      ? `Editar variante ${(variantModal.index ?? 0) + 1}`
      : 'Nueva variante';

  if (!hydrated) {
    return (
      <Paper p="md" withBorder>
        <Text size="sm">Cargando…</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" maw={960} mx="auto" withBorder shadow="xs">
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <CrearFormFields
            form={form}
            handleChange={handleChange}
            categoryInput={categoryInput}
            subcategoryInput={subcategoryInput}
            lineInput={lineInput}
            onCategoryInputChange={onCategoryInputChange}
            onSubcategoryInputChange={onSubcategoryInputChange}
            onLineInputChange={onLineInputChange}
            onCategoryBlurCommit={commitCategoryBlur}
            onSubcategoryBlurCommit={commitSubcategoryBlur}
            onLineBlurCommit={commitLineBlur}
            categoryLabels={categoryOptions.map((o) => o.label)}
            subcategoryLabels={subcategoryOptions.map((o) => o.label)}
            lineLabels={lineOptions.map((o) => o.label)}
          />

          <CrearVariantsSection
            initialVariants={initialVariants}
            onOpenNew={openVariantNew}
            onOpenEdit={openVariantEdit}
            onRemoveVariant={removeVariant}
            variantModalOpen={Boolean(variantModal)}
          />

          <Stack gap="xs">
            {message && (
              <Text
                size="sm"
                c={message.includes('correctamente') ? 'green' : 'red'}
              >
                {message}
              </Text>
            )}
            <Button type="submit" loading={saving}>
              {saving ? 'Guardando...' : 'Crear producto'}
            </Button>
          </Stack>
        </Stack>
      </form>

      <CrearVariantModal
        open={Boolean(variantModal && variantDraft)}
        title={variantModalTitle}
        draft={variantDraft}
        setDraft={setVariantDraft}
        onClose={() => closeVariantModal()}
        onConfirm={confirmVariantModal}
        saving={variantModalBusy}
        confirmLabel="Guardar variante"
        products={products}
        valueSuggestionsByName={valueSuggestionsByName}
        allValueSuggestions={allValueSuggestions}
        variableNameSuggestions={variableNameSuggestions}
      />
    </Paper>
  );
}
