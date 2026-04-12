import { useState, useEffect } from 'react';
import { ActionIcon, Button, Group, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useProductsService } from '../hooks/useProductsService';
import { useProducts } from '../context/ProductsContext';
import { useBaseEditCatalogOptions } from '../hooks/useBaseEditCatalogOptions';
import { uploadFile } from '../api/documentService';
import { toUpperFormValue } from '../utils/formText';
import BaseEditProductFields from './base-edit/BaseEditProductFields';
import BaseEditVariantModal from './base-edit/BaseEditVariantModal';
import { VARIANT_SCOPE, VARIANT_SCOPE_LABEL } from '../constants/variantScope';
import './BaseEditModal.css';

function toSortedSelectData(mapLike) {
  return [...mapLike.values()]
    .sort((a, b) => String(a.label).localeCompare(String(b.label), 'es'))
    .map((x) => ({ value: x.value, label: x.label }));
}

export default function BaseEditModal({ product: productProp, onClose, onSaved }) {
  const productsService = useProductsService();
  const { products, reload } = useProducts();
  const product = products.find((p) => p.id === productProp?.id) ?? productProp;

  const [form, setForm] = useState({
    name: product?.name ?? '',
    categoryId: product?.categoryId ? String(product.categoryId) : '',
    subcategoryId: product?.subcategoryId ? String(product.subcategoryId) : '',
    lineId: product?.lineId ? String(product.lineId) : '',
  });
  const [variants, setVariants] = useState(
    () =>
      product?.variants?.map((v) => ({
        id: v.id,
        sapRef: v.sapRef ?? '',
        image: v.image ?? '',
        model: v.model ?? '',
        variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
        imageFile: null,
        modelFile: null,
        components: (v.components || []).map((c) => ({
          id: c.id,
          variableDefinitionId: c.variableDefinitionId ?? null,
          name: c.name ?? '',
          value: c.value ?? '',
          sapRef: c.sapRef ?? '',
          sapCode: c.sapCode ?? '',
          editable: c.editable !== false,
          listOnly: c.listOnly === true,
        })),
      })) ?? []
  );

  useEffect(() => {
    if (product?.variants) {
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          sapRef: v.sapRef ?? '',
          image: v.image ?? '',
          model: v.model ?? '',
          variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
          imageFile: null,
          modelFile: null,
          components: (v.components || []).map((c) => ({
            id: c.id,
            variableDefinitionId: c.variableDefinitionId ?? null,
            name: c.name ?? '',
            value: c.value ?? '',
            sapRef: c.sapRef ?? '',
            sapCode: c.sapCode ?? '',
            editable: c.editable !== false,
            listOnly: c.listOnly === true,
          })),
        }))
      );
    }
  }, [product?.id, product?.variants]);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name ?? '',
      categoryId: product.categoryId ? String(product.categoryId) : '',
      subcategoryId: product.subcategoryId ? String(product.subcategoryId) : '',
      lineId: product.lineId ? String(product.lineId) : '',
    });
  }, [product?.id, product?.name, product?.categoryId, product?.subcategoryId, product?.lineId]);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);
  const [subcategoryMeta, setSubcategoryMeta] = useState(() => new Map());
  const [lineMeta, setLineMeta] = useState(() => new Map());

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
    // Recomendaciones globales (no dependientes). Al elegir subcategoría/línea, se ajustan padres automáticamente.
    const sub = new Map();
    const lin = new Map();
    const subMeta = new Map();
    const linMeta = new Map();
    for (const p of products || []) {
      if (p?.subcategoryId && p?.subcategory) {
        const id = String(p.subcategoryId);
        if (!sub.has(id)) {
          sub.set(id, { value: id, label: String(p.subcategory) });
          subMeta.set(id, { categoryId: p?.categoryId ? String(p.categoryId) : '' });
        }
      }
      if (p?.lineId && p?.line) {
        const id = String(p.lineId);
        if (!lin.has(id)) {
          lin.set(id, { value: id, label: String(p.line) });
          linMeta.set(id, {
            subcategoryId: p?.subcategoryId ? String(p.subcategoryId) : '',
            categoryId: p?.categoryId ? String(p.categoryId) : '',
          });
        }
      }
    }
    setSubcategoryMeta(subMeta);
    setLineMeta(linMeta);
    setSubcategoryOptions(toSortedSelectData(sub));
    setLineOptions(toSortedSelectData(lin));
  }, [products]);

  const [variantDialog, setVariantDialog] = useState(null);
  const [variantDraft, setVariantDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const UPPER_FORM = new Set(['name']);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = UPPER_FORM.has(name) ? toUpperFormValue(value) : value;
    setForm((prev) => ({ ...prev, [name]: v }));
  };

  const onTaxonomyChange = (key, value) => {
    const v = value || '';
    setForm((prev) => {
      if (key === 'categoryId') return { ...prev, categoryId: v, subcategoryId: '', lineId: '' };
      if (key === 'subcategoryId') {
        const cat = subcategoryMeta.get(v)?.categoryId || prev.categoryId || '';
        return { ...prev, categoryId: cat, subcategoryId: v, lineId: '' };
      }
      if (key === 'lineId') {
        const meta = lineMeta.get(v);
        const sub = meta?.subcategoryId || prev.subcategoryId || '';
        const cat = meta?.categoryId || subcategoryMeta.get(sub)?.categoryId || prev.categoryId || '';
        return { ...prev, categoryId: cat, subcategoryId: sub, lineId: v };
      }
      return prev;
    });
  };

  const { componentOptions, componentValuesByRef, allComponentValues } = useBaseEditCatalogOptions(products);

  const handleSaveBase = async () => {
    setMessage('');
    setSaving(true);
    try {
      await productsService.updateBase({
        id: product.id,
        name: form.name,
        categoryId: form.categoryId || null,
        subcategoryId: form.subcategoryId || null,
        lineId: form.lineId || null,
      });
      setMessage('Producto actualizado');
      reload();
      onSaved?.();
    } catch (err) {
      setMessage(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBase = () => {
    modals.openConfirmModal({
      title: 'Eliminar producto',
      children: '¿Eliminar este producto y todas sus variantes?',
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setSaving(true);
        try {
          await productsService.deleteBase(product.id);
          reload();
          onClose();
        } catch (err) {
          setMessage(err?.message || 'Error al eliminar');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const closeVariantDialog = () => {
    setVariantDialog(null);
    setVariantDraft(null);
  };

  const openVariantDialogNew = () => {
    setMessage('');
    setVariantDraft({
      sapRef: '',
      imageFile: null,
      modelFile: null,
      variantScope: VARIANT_SCOPE.LINE,
      components: [
        {
          componentId: null,
          variableDefinitionId: null,
          componentName: '',
          componentSapRef: '',
          componentSapCode: '',
          componentValue: '',
          editable: true,
          listOnly: false,
        },
      ],
    });
    setVariantDialog({ mode: 'new' });
  };

  const openVariantDialogEdit = (idx) => {
    setMessage('');
    const v = variants[idx];
    if (!v) return;
    setVariantDraft({
      id: v.id,
      sapRef: v.sapRef ?? '',
      image: v.image ?? '',
      model: v.model ?? '',
      variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
      imageFile: null,
      modelFile: null,
      components: (v.components || []).map((c) => ({
        id: c.id,
        variableDefinitionId: c.variableDefinitionId ?? null,
        name: c.name ?? '',
        value: c.value ?? '',
        sapRef: c.sapRef ?? '',
        sapCode: c.sapCode ?? '',
        editable: c.editable !== false,
        listOnly: c.listOnly === true,
      })),
    });
    setVariantDialog({ mode: 'edit', idx });
  };

  const saveNewVariantFromModal = async () => {
    const d = variantDraft;
    if (!d || variantDialog?.mode !== 'new') return;
    if (!String(d.sapRef ?? '').trim()) {
      setMessage('Indicá SAP o modelo de la variante.');
      return;
    }
    const comps = d.components.filter(
      (c) =>
        c.componentId ||
        c.variableDefinitionId ||
        (c.componentName ?? '').trim() ||
        (c.componentValue ?? '').trim()
    );
    if (comps.length === 0) {
      setMessage('La variante debe tener al menos una variable');
      return;
    }
    if (!d.imageFile || !d.modelFile) {
      setMessage('La nueva variante requiere imagen y modelo');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const imgRes = await uploadFile(d.imageFile, 'image');
      const modRes = await uploadFile(d.modelFile, 'model');
      const v = await productsService.addVariantToBase({
        baseId: product.id,
        sapRef: d.sapRef.trim(),
        image: imgRes.key,
        model: modRes.key,
        variantScope: d.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
        components: comps.map((c) => ({
          componentId: c.componentId || null,
          variableDefinitionId: c.variableDefinitionId || null,
          componentName: c.componentName?.trim() || null,
          componentSapRef: null,
          componentSapCode: null,
          componentValue: c.componentValue?.trim() || null,
          componentEditable: c.editable !== false,
          componentListOnly: c.listOnly === true,
        })),
      });
      setVariants((prev) => [
        ...prev,
        {
          id: v.id,
          sapRef: v.sapRef ?? '',
          image: v.image ?? '',
          model: v.model ?? '',
          variantScope: v.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
          imageFile: null,
          modelFile: null,
          components: (v.components || []).map((c) => ({
            id: c.id,
            variableDefinitionId: c.variableDefinitionId ?? null,
            name: c.name,
            value: c.value,
            sapRef: c.sapRef,
            sapCode: c.sapCode,
            editable: c.editable !== false,
            listOnly: c.listOnly === true,
          })),
        },
      ]);
      closeVariantDialog();
      reload();
    } catch (err) {
      setMessage(err?.message || 'Error al agregar variante');
    } finally {
      setSaving(false);
    }
  };

  const saveEditVariantFromModal = async () => {
    if (variantDialog?.mode !== 'edit') return;
    const d = variantDraft;
    if (!d?.id) return;
    if (!String(d.sapRef ?? '').trim()) {
      setMessage('Indicá SAP o modelo de la variante.');
      return;
    }
    const comps = d.components.filter(
      (c) =>
        c.id ||
        c.variableDefinitionId ||
        (c.name ?? '').trim() ||
        (c.value ?? '').trim()
    );
    if (comps.length === 0) {
      setMessage('La variante debe tener al menos una variable');
      return;
    }
    const invalidNew = comps.find((c) => !c.id && !c.variableDefinitionId && !(c.name ?? '').trim());
    if (invalidNew) {
      setMessage('Cada variable nueva debe tener nombre o definición');
      return;
    }
    let imageKey = d.image;
    let modelKey = d.model;
    if (d.imageFile) {
      const res = await uploadFile(d.imageFile, 'image');
      imageKey = res.key;
    }
    if (d.modelFile) {
      const res = await uploadFile(d.modelFile, 'model');
      modelKey = res.key;
    }
    if (!imageKey?.trim() || !modelKey?.trim()) {
      setMessage('Cada variante debe tener imagen y modelo en sistema. Suba archivos nuevos si faltan.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await productsService.updateVariant({
        id: d.id,
        sapRef: d.sapRef.trim(),
        image: imageKey,
        model: modelKey,
        variantScope: d.variantScope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
        components: comps.map((c) => ({
          componentId: c.id || null,
          variableDefinitionId: c.variableDefinitionId || null,
          componentName: (c.name ?? c.componentName ?? '').trim() || null,
          componentSapRef: null,
          componentSapCode: null,
          componentValue: (c.value ?? c.componentValue ?? '').trim() || null,
          componentEditable: c.editable !== false,
          componentListOnly: c.listOnly === true,
        })),
      });
      closeVariantDialog();
      reload();
    } catch (err) {
      setMessage(err?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = (vIdx) => {
    const v = variants[vIdx];
    modals.openConfirmModal({
      title: 'Eliminar variante',
      children: `¿Eliminar variante ${v.sapRef?.trim() || '—'}?`,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        if (variantDialog?.mode === 'edit' && variantDialog.idx === vIdx) {
          closeVariantDialog();
        }
        setSaving(true);
        setMessage('');
        try {
          await productsService.deleteVariant(v.id);
          setVariants((prev) => prev.filter((_, i) => i !== vIdx));
          reload();
        } catch (err) {
          setMessage(err?.message || 'Error al eliminar');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const patchEditDraft = (fn) => {
    setVariantDraft((prev) => (prev && prev.id ? fn(prev) : prev));
  };

  const patchVariantDraftScope = (scope) => {
    setVariantDraft((prev) =>
      prev
        ? {
            ...prev,
            variantScope: scope === VARIANT_SCOPE.SPECIAL ? VARIANT_SCOPE.SPECIAL : VARIANT_SCOPE.LINE,
          }
        : prev
    );
  };

  const editDraftSetSap = (value) => {
    patchEditDraft((p) => ({ ...p, sapRef: toUpperFormValue(value) }));
  };

  const editDraftSetFile = (field, file) => {
    patchEditDraft((p) => ({ ...p, [field]: file }));
  };

  const editDraftPatchComp = (cIdx, patch) => {
    patchEditDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => (i === cIdx ? { ...c, ...patch } : c)),
    }));
  };

  const editDraftPatchCompNameValue = (cIdx, field, raw) => {
    const val = field === 'name' || field === 'value' ? toUpperFormValue(raw) : raw;
    editDraftPatchComp(cIdx, { [field]: val });
  };

  const blurEditDraftComponentName = (cIdx) => {
    setVariantDraft((d) => {
      if (!d?.id) return d;
      const c = d.components[cIdx];
      if (!(c?.name ?? '').trim()) return d;
      const found = componentOptions.find((o) => (o.label || '').trim() === (c.name || '').trim());
      if (found && !c.id) {
        return {
          ...d,
          components: d.components.map((comp, j) =>
            j === cIdx
              ? {
                  ...comp,
                  id: found.id,
                  variableDefinitionId: found.variableDefinitionId ?? comp.variableDefinitionId,
                  name: (comp.name || found.label || '').trim(),
                  sapRef: '',
                  sapCode: '',
                }
              : comp
          ),
        };
      }
      return d;
    });
  };

  const editDraftAddComp = () => {
    patchEditDraft((p) => ({
      ...p,
      components: [
        ...p.components,
        {
          id: null,
          variableDefinitionId: null,
          name: '',
          value: '',
          sapRef: '',
          sapCode: '',
          editable: true,
          listOnly: false,
        },
      ],
    }));
  };

  const editDraftRemoveComp = (cIdx) => {
    patchEditDraft((p) => ({
      ...p,
      components: p.components.filter((_, j) => j !== cIdx),
    }));
  };

  const patchNewDraft = (fn) => {
    setVariantDraft((prev) => (prev && !prev.id ? fn(prev) : prev));
  };

  const newDraftSetSap = (value) => {
    patchNewDraft((p) => ({ ...p, sapRef: toUpperFormValue(value) }));
  };

  const newDraftSetFile = (field, file) => {
    patchNewDraft((p) => ({ ...p, [field]: file }));
  };

  const newDraftPatchComp = (cIdx, field, value) => {
    const upperFields = new Set(['componentName', 'componentSapRef', 'componentSapCode', 'componentValue']);
    const v = upperFields.has(field) ? toUpperFormValue(value) : value;
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => (i === cIdx ? { ...c, [field]: v } : c)),
    }));
  };

  const newDraftComponentSelect = (cIdx, val) => {
    const found = componentOptions.find(
      (o) =>
        String(o.label || '').toLocaleUpperCase('es-419') ===
        String(val || '').trim().toLocaleUpperCase('es-419')
    );
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => {
        if (i !== cIdx) return c;
        if (found) {
          return {
            ...c,
            componentId: found.id,
            variableDefinitionId: found.variableDefinitionId ?? null,
            componentName: '',
            componentSapRef: '',
            componentSapCode: '',
          };
        }
        return {
          ...c,
          componentId: null,
          variableDefinitionId: null,
          componentName: toUpperFormValue(val || '').trim(),
          componentSapRef: '',
          componentSapCode: '',
        };
      }),
    }));
  };

  const newDraftAddComp = () => {
    patchNewDraft((p) => ({
      ...p,
      components: [
        ...p.components,
        {
          componentId: null,
          variableDefinitionId: null,
          componentName: '',
          componentSapRef: '',
          componentSapCode: '',
          componentValue: '',
          editable: true,
          listOnly: false,
        },
      ],
    }));
  };

  const newDraftRemoveComp = (cIdx) => {
    patchNewDraft((p) => ({
      ...p,
      components: p.components.filter((_, i) => i !== cIdx),
    }));
  };

  const newDraftPatchCompFlags = (cIdx, patch) => {
    patchNewDraft((p) => ({
      ...p,
      components: p.components.map((c, i) => (i === cIdx ? { ...c, ...patch } : c)),
    }));
  };

  return (
    <div
      className="base-edit-overlay"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        if (variantDialog) {
          e.preventDefault();
          closeVariantDialog();
        }
      }}
      role="presentation"
    >
      <div
        className="base-edit-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="base-edit-header">
          <Title order={2}>Editar producto: {product?.name}</Title>
          <Group gap="xs" wrap="nowrap" className="base-edit-header-actions">
            <Button type="button" size="sm" color="brand" onClick={handleSaveBase} disabled={saving}>
              Guardar producto
            </Button>
            <Button type="button" size="sm" color="red" variant="light" onClick={handleDeleteBase} disabled={saving}>
              Eliminar producto
            </Button>
            <ActionIcon variant="subtle" color="gray" size="lg" className="base-edit-close" onClick={onClose} aria-label="Cerrar">
              ×
            </ActionIcon>
          </Group>
        </div>

        <div className="base-edit-body">
          <section className="base-edit-section">
            <Title order={4} mb="sm">
              Datos del producto
            </Title>
            <BaseEditProductFields
              form={form}
              handleChange={handleChange}
              categoryOptions={categoryOptions}
              subcategoryOptions={subcategoryOptions}
              lineOptions={lineOptions}
              onTaxonomyChange={onTaxonomyChange}
            />
          </section>

          <section className="base-edit-section">
            <Title order={4} mb="xs">
              Variantes ({variants.length})
            </Title>
            <Text size="sm" c="dimmed" mb="md" className="base-edit-variants-hint">
              Editá o agregá variantes en un modal; la lista queda compacta.
            </Text>
            {variants.map((v, vIdx) => (
              <div key={v.id} className="base-edit-variant-block base-edit-variant-summary">
                <div className="base-edit-variant-header">
                  <span>
                    Variante {vIdx + 1}: <strong>{v.sapRef?.trim() || '—'}</strong>{' '}
                    <span className="base-edit-variant-scope-tag">
                      ({VARIANT_SCOPE_LABEL[v.variantScope] || VARIANT_SCOPE_LABEL[VARIANT_SCOPE.LINE]})
                    </span>
                  </span>
                  <Group gap="xs">
                    <Button type="button" size="xs" variant="light" color="brand" onClick={() => openVariantDialogEdit(vIdx)} disabled={saving}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="light"
                      color="red"
                      className="base-edit-variant-delete"
                      onClick={() => handleDeleteVariant(vIdx)}
                      disabled={saving || variants.length <= 1}
                    >
                      Eliminar
                    </Button>
                  </Group>
                </div>
                <div className="base-edit-variant-preview">
                  {v.components.map((c) => (
                    <span key={c.id || `${vIdx}-${c.name}`} className="base-edit-chip">
                      {c.name || '—'}: {c.value || '—'}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <Button type="button" className="base-edit-add-variant" color="brand" variant="light" onClick={openVariantDialogNew} disabled={saving} mt="sm">
              + Agregar variante
            </Button>

            <BaseEditVariantModal
              variantDialog={variantDialog}
              variantDraft={variantDraft}
              saving={saving}
              products={products}
              componentOptions={componentOptions}
              componentValuesByRef={componentValuesByRef}
              allComponentValues={allComponentValues}
              onClose={closeVariantDialog}
              onSaveNew={saveNewVariantFromModal}
              onSaveEdit={saveEditVariantFromModal}
              editDraftSetSap={editDraftSetSap}
              editDraftSetFile={editDraftSetFile}
              editDraftPatchComp={editDraftPatchComp}
              editDraftPatchCompNameValue={editDraftPatchCompNameValue}
              blurEditDraftComponentName={blurEditDraftComponentName}
              editDraftAddComp={editDraftAddComp}
              editDraftRemoveComp={editDraftRemoveComp}
              newDraftSetSap={newDraftSetSap}
              newDraftSetFile={newDraftSetFile}
              newDraftPatchComp={newDraftPatchComp}
              newDraftComponentSelect={newDraftComponentSelect}
              newDraftAddComp={newDraftAddComp}
              newDraftRemoveComp={newDraftRemoveComp}
              newDraftPatchCompFlags={newDraftPatchCompFlags}
              setVariantScope={patchVariantDraftScope}
            />
          </section>
        </div>

        {message && (
          <Text size="sm" className="base-edit-message" c={message.includes('actualizado') ? 'green' : 'red'}>
            {message}
          </Text>
        )}
      </div>
    </div>
  );
}
