import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, ActionIcon, Stack, Text } from '@mantine/core';
import { getMediaUrls } from '../api/documentService';
import { isGltfHttpUrl } from '../constants/previewableMedia';
import { isSafeHttpUrl } from '../utils/safeUrl';
import ImageWithModal from './ImageWithModal';
import './ProductDetailModal.css';

function rowId(c) {
  const id = c?.id ?? c?.componentId;
  return id != null && id !== '' ? String(id) : '';
}

function variantRows(v) {
  if (!v) return [];
  return Array.isArray(v.components) ? v.components : Array.isArray(v.variables) ? v.variables : [];
}

/**
 * Agrupa por nombre de variable; cada valor aparece una vez con refs (componentId + variantId) por si varias variantes comparten texto.
 */
function buildVariableSlots(variants) {
  if (!variants?.length) return [];
  const byName = new Map();
  for (const v of variants) {
    for (const c of variantRows(v)) {
      const name = (c?.name || '').trim();
      const cid = rowId(c);
      const val = c.value != null ? String(c.value).trim() : '';
      if (!name || !val || !cid) continue;
      if (!byName.has(name)) byName.set(name, new Map());
      const valMap = byName.get(name);
      if (!valMap.has(val)) valMap.set(val, []);
      const arr = valMap.get(val);
      if (!arr.some((r) => String(r.componentId) === String(cid))) {
        arr.push({ componentId: String(cid), variantId: v.id });
      }
    }
  }
  return [...byName.entries()]
    .map(([title, valMap]) => ({
      title,
      options: [...valMap.entries()]
        .map(([value, refs]) => ({ value, refs }))
        .sort((a, b) => a.value.localeCompare(b.value, 'es')),
    }))
    .filter((s) => s.options.length > 0);
}

/** Chips / miniatura: alinear selección con una variante concreta. */
function selectionsFromVariant(variant, slots) {
  const initial = {};
  if (!variant || !slots?.length) return initial;
  const rows = variantRows(variant);
  for (const slot of slots) {
    const { title, options } = slot;
    const comp = rows.find((c) => (c?.name || '').trim() === title);
    if (!comp) continue;
    const val = String(comp.value ?? '').trim();
    const cid = rowId(comp);
    if (!cid) continue;
    const opt = options.find(
      (o) =>
        String(o.value).trim() === val && o.refs.some((r) => String(r.componentId) === String(cid))
    );
    if (opt) initial[title] = { componentId: String(cid), value: opt.value };
  }
  return initial;
}

/**
 * Variante cuya lista de variables coincide exactamente con las selecciones (mismo id y valor por fila).
 * No exige len(sel) === len(comps) global: exige que cada componente de la variante tenga selección correcta
 * y que no queden selecciones huérfanas que pertenezcan a otra variante.
 */
function findMatchingVariant(variants, selectionsByCompId) {
  if (!variants?.length || !selectionsByCompId) return null;
  const selEntries = Object.entries(selectionsByCompId).filter(([, v]) =>
    String(v?.value ?? '').trim()
  );
  if (selEntries.length === 0) return null;
  for (const v of variants) {
    const comps = variantRows(v);
    if (comps.length === 0) continue;
    const compIds = new Set(comps.map((c) => rowId(c)).filter(Boolean));
    const everyCompMatched = comps.every((c) => {
      const id = rowId(c);
      if (!id) return false;
      const sel = selectionsByCompId[id];
      return sel && String(sel.value || '').trim() === String(c.value || '').trim();
    });
    if (!everyCompMatched) continue;
    const noExtraSelections = selEntries.every(([compId]) => compIds.has(String(compId)));
    if (noExtraSelections && selEntries.length === comps.length) return v;
  }
  return null;
}

/** Mejor coincidencia parcial por chips elegidos (imagen/modelo acorde al color, etc.). */
function findPreviewVariant(variants, selectionsByCompId) {
  const exact = findMatchingVariant(variants, selectionsByCompId);
  if (exact) return exact;
  const selEntries = Object.entries(selectionsByCompId || {}).filter(
    ([, v]) => v?.value != null && String(v.value).trim()
  );
  if (!variants?.length || !selEntries.length) return variants?.[0] || null;
  let best = variants[0];
  let bestScore = -1;
  for (const v of variants) {
    let score = 0;
    const comps = variantRows(v);
    for (const [compId, sel] of selEntries) {
      const c = comps.find((x) => rowId(x) === String(compId));
      if (c && String(c.value || '').trim() === String(sel.value || '').trim()) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

/** Tipo de archivo desde URL (DWG, STEP, etc.) — todo en la misma vista, sin visores externos. */
function cadFormatFromUrl(url) {
  if (!url || typeof url !== 'string') return { ext: 'CAD', blurb: 'archivo técnico' };
  let path = url;
  try {
    path = new URL(url, 'https://placeholder.local').pathname;
  } catch {
    path = url.split('?')[0];
  }
  const m = path.match(/\.([a-z0-9]{1,12})$/i);
  const ext = m ? m[1].toUpperCase() : 'ARCHIVO';
  const blurbs = {
    DWG: 'plano o modelo DWG',
    DXF: 'intercambio DXF',
    STEP: 'modelo STEP',
    STP: 'modelo STEP',
    IFC: 'modelo BIM IFC',
    PDF: 'documento PDF',
  };
  return { ext, blurb: blurbs[ext] || 'archivo técnico' };
}

/** Carrusel: una diapositiva por variante (imagen) + una al final con el modelo (GLB/CAD) si existe. */
function buildMediaSlides(variants, modelUrl) {
  const list = (variants || []).map((v) => ({
    type: 'image',
    key: `img-${v.id}`,
    variant: v,
  }));
  if (modelUrl) {
    list.push({ type: 'model', key: 'model' });
  }
  return list;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  isDesigner = false,
  onEdit,
  onDelete,
}) {
  const [modelUrl, setModelUrl] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const variantsNorm = useMemo(() => {
    // El modal de detalle muestra todas las variantes del producto; el filtro del catálogo no debe ocultarlas aquí
    return (product?.variants || []).map((v) => ({
      ...v,
      components: variantRows(v),
    }));
  }, [product?.variants]);

  const variableSlots = useMemo(() => buildVariableSlots(variantsNorm), [variantsNorm]);

  const [selections, setSelections] = useState({});
  useEffect(() => {
    const v0 = variantsNorm[0];
    if (!v0 || !variableSlots.length) {
      setSelections({});
      return;
    }
    setSelections(selectionsFromVariant(v0, variableSlots));
  }, [product?.id, variableSlots, variantsNorm]);

  const selectionsByCompId = useMemo(() => {
    const out = {};
    for (const sel of Object.values(selections || {})) {
      if (sel?.componentId) out[sel.componentId] = sel;
    }
    return out;
  }, [selections]);

  const matchingVariant = useMemo(
    () => findMatchingVariant(variantsNorm, selectionsByCompId),
    [variantsNorm, selectionsByCompId]
  );

  const previewVariant = useMemo(
    () => findPreviewVariant(variantsNorm, selectionsByCompId),
    [variantsNorm, selectionsByCompId]
  );

  useEffect(() => {
    const key = previewVariant?.model;
    if (!key) {
      setModelUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getMediaUrls([key], 'model');
        if (!cancelled) setModelUrl(res.data?.[key] || null);
      } catch {
        if (!cancelled) setModelUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVariant?.model, previewVariant?.id]);

  useEffect(() => {
    const key = previewVariant?.image;
    if (!key) {
      setPreviewImageUrl(product?.fullUrl ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getMediaUrls([key], 'image');
        if (!cancelled) setPreviewImageUrl(res.data?.[key] || product?.fullUrl || null);
      } catch {
        if (!cancelled) setPreviewImageUrl(product?.fullUrl ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewVariant?.image, previewVariant?.id, product?.fullUrl]);

  const slides = useMemo(
    () => buildMediaSlides(variantsNorm, modelUrl),
    [variantsNorm, modelUrl]
  );

  useEffect(() => {
    setActiveSlideIndex(0);
  }, [product?.id]);

  useEffect(() => {
    setActiveSlideIndex((prev) =>
      slides.length === 0 ? 0 : Math.min(prev, slides.length - 1)
    );
  }, [slides.length]);

  const slideSyncKey = useMemo(
    () => `${variantsNorm.map((v) => v.id).join(',')}#${modelUrl ? '1' : '0'}`,
    [variantsNorm, modelUrl]
  );

  /** Si cambian los chips, alinear la foto con la variante en vista; no sacar al usuario de la diapositiva «Modelo». */
  useEffect(() => {
    if (!previewVariant?.id) return;
    const slideList = buildMediaSlides(variantsNorm, modelUrl);
    if (slideList.length === 0) return;
    const modelIdx = slideList.findIndex((s) => s.type === 'model');
    setActiveSlideIndex((prev) => {
      if (modelIdx >= 0 && prev === modelIdx) return prev;
      const imgIdx = slideList.findIndex(
        (s) =>
          s.type === 'image' && String(s.variant?.id) === String(previewVariant.id)
      );
      if (imgIdx >= 0) return imgIdx;
      return prev;
    });
  }, [previewVariant?.id, slideSyncKey]);

  const safeModelUrl = modelUrl && isSafeHttpUrl(modelUrl) ? modelUrl : null;
  const viewerSrc =
    safeModelUrl && isGltfHttpUrl(safeModelUrl)
      ? `${import.meta.env.BASE_URL}viewer.html?model=${encodeURIComponent(safeModelUrl)}`
      : null;

  const showCadFallback = Boolean(safeModelUrl) && !viewerSrc;

  const cadFormat = useMemo(() => cadFormatFromUrl(safeModelUrl), [safeModelUrl]);

  const handleSelect = (title, opt) => {
    const refs = opt.refs || [];
    const ref =
      refs.find((r) => String(r.variantId) === String(previewVariant?.id)) ?? refs[0];
    if (!ref) return;
    setSelections((prev) => ({
      ...prev,
      [title]: { componentId: ref.componentId, value: opt.value },
    }));
  };

  const handlePickVariantThumb = (variant) => {
    setSelections(selectionsFromVariant(variant, variableSlots));
  };

  const goPrevSlide = () => {
    if (slides.length < 2) return;
    const next = (activeSlideIndex - 1 + slides.length) % slides.length;
    setActiveSlideIndex(next);
    const s = slides[next];
    if (s?.type === 'image') {
      setSelections(selectionsFromVariant(s.variant, variableSlots));
    }
  };

  const goNextSlide = () => {
    if (slides.length < 2) return;
    const next = (activeSlideIndex + 1) % slides.length;
    setActiveSlideIndex(next);
    const s = slides[next];
    if (s?.type === 'image') {
      setSelections(selectionsFromVariant(s.variant, variableSlots));
    }
  };

  const activeSlide = slides[activeSlideIndex] ?? null;
  const isModelSlideActive = activeSlide?.type === 'model';

  const previewValueForSlot = (title) => {
    const rows = variantRows(previewVariant);
    const c = rows.find((x) => (x?.name || '').trim() === title);
    return c?.value != null ? String(c.value).trim() : '';
  };

  const variantRefLabel =
    previewVariant?.sapRef?.trim() ||
    previewVariant?.sapCode?.trim() ||
    product?.name?.trim() ||
    '—';

  const handleAddToCart = () => {
    if (!onAddToCart) return;
    const caracteristicas = {};
    const _componentOriginals = {};
    const variantsList = variantsNorm;
    for (const [, sel] of Object.entries(selections)) {
      if (!sel?.componentId || sel.value == null) continue;
      const val = String(sel.value).trim();
      if (!val) continue;
      caracteristicas[sel.componentId] = val;
      const comp = variantsList.flatMap((v) => variantRows(v)).find((c) => String(c.id) === String(sel.componentId));
      if (comp) {
        const origVal = comp.originalValue ?? comp.value ?? '';
        _componentOriginals[sel.componentId] = {
          id: comp.id,
          name: comp.name,
          sapRef: comp.sapRef,
          sapCode: comp.sapCode,
          value: origVal,
          editable: comp.editable !== false,
          listOnly: comp.listOnly === true,
        };
      }
    }
    const _originalCaracteristicas = {};
    const selVariant = matchingVariant || variantsList[0];
    for (const c of variantRows(selVariant)) {
      if (c?.name) _originalCaracteristicas[c.name] = (c.originalValue ?? c.value ?? '').trim();
    }
    onAddToCart({
      ...product,
      image: selVariant?.image,
      fullUrl: previewImageUrl ?? product.fullUrl,
      caracteristicas,
      _componentOriginals,
      _originalCaracteristicas,
      _selectedVariantId: matchingVariant?.id ?? variantsList[0]?.id,
    });
  };

  return (
    <Modal
      opened
      onClose={onClose}
      closeOnClickOutside={false}
      padding={0}
      withCloseButton={false}
      size="xl"
      zIndex={1000}
      overlayProps={{ opacity: 0.55 }}
      classNames={{ content: 'modal-content', inner: 'modal-mantine-inner' }}
      lockScroll
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <div className="modal-header">
          <h2 id="product-detail-title">{product?.name}</h2>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Cerrar">
            ×
          </ActionIcon>
        </div>

        <div className="modal-body">
          {slides.length > 0 ? (
            <aside className="modal-col modal-col-thumbs" aria-label="Vista: fotos y modelo">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  className={[
                    'modal-variant-thumb',
                    s.type === 'model' ? 'modal-variant-thumb--model' : '',
                    activeSlideIndex === i ? 'is-active' : '',
                    s.type === 'image' &&
                    String(s.variant?.id) === String(previewVariant?.id) &&
                    (isModelSlideActive || activeSlideIndex === i)
                      ? 'is-preview-variant'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    setActiveSlideIndex(i);
                    if (s.type === 'image') handlePickVariantThumb(s.variant);
                  }}
                  title={
                    s.type === 'model' ? 'Modelo 3D / archivo' : s.variant.sapRef || 'Foto variante'
                  }
                >
                  {s.type === 'image' ? (
                    s.variant.fullUrl ? (
                      <img src={s.variant.fullUrl} alt="" loading="lazy" draggable={false} />
                    ) : (
                      <span className="modal-variant-thumb-fallback" aria-hidden>
                        ?
                      </span>
                    )
                  ) : (
                    <span className="modal-variant-thumb-model">3D</span>
                  )}
                </button>
              ))}
            </aside>
          ) : (
            <aside className="modal-col modal-col-thumbs modal-col-thumbs--empty" aria-hidden />
          )}

          <section className="modal-col modal-col-stage">
            <div className="modal-viewer-stage">
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    className="modal-carousel-arrow modal-carousel-arrow--prev"
                    onClick={goPrevSlide}
                    aria-label="Vista anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="modal-carousel-arrow modal-carousel-arrow--next"
                    onClick={goNextSlide}
                    aria-label="Vista siguiente"
                  >
                    ›
                  </button>
                </>
              )}
              <div className="modal-viewer-inner">
                {activeSlide?.type === 'image' && (
                  <div className="modal-viewer-placeholder">
                    {activeSlide.variant.fullUrl ? (
                      <ImageWithModal src={activeSlide.variant.fullUrl} alt={product.name}>
                        <img src={activeSlide.variant.fullUrl} alt={product.name} />
                      </ImageWithModal>
                    ) : (
                      <span>Sin imagen</span>
                    )}
                  </div>
                )}
                {activeSlide?.type === 'model' &&
                  (viewerSrc ? (
                    <iframe title="3D viewer" src={viewerSrc} className="modal-iframe" />
                  ) : showCadFallback ? (
                    <div className="modal-cad-fallback">
                      <div className="modal-cad-hero">
                        {previewImageUrl ? (
                          <img src={previewImageUrl} alt="" className="modal-cad-hero-img" />
                        ) : (
                          <div className="modal-cad-hero-empty" aria-hidden />
                        )}
                        <span className="modal-cad-badge" title={cadFormat.blurb}>
                          {cadFormat.ext}
                        </span>
                      </div>
                      <div className="modal-cad-panel">
                        <p className="modal-cad-panel-kicker">Archivo adjunto a esta variante</p>
                        <p className="modal-cad-panel-text">
                          <strong>{cadFormat.ext}</strong> — {cadFormat.blurb}. La imagen de arriba es la referencia
                          visual del producto. La vista 3D interactiva en el navegador solo aplica a{' '}
                          <strong>GLB</strong>/<strong>GLTF</strong>; el resto se gestiona aquí mismo con imagen + descarga.
                        </p>
                        <a
                          href={safeModelUrl || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-cad-download"
                        >
                          Descargar {cadFormat.ext}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="modal-viewer-placeholder">
                      <span>Sin modelo</span>
                    </div>
                  ))}
                {!activeSlide && (
                  <div className="modal-viewer-placeholder">
                    <span>Sin vista previa</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="modal-col modal-col-details modal-info">
            <Stack gap="md" className="modal-info-stack">
              <div className="modal-info-top">
                <div className="modal-ref-block">
                  <Text component="p" className="modal-code" fw={600}>
                    SAP / modelo: {variantRefLabel}
                  </Text>
                </div>
                <div className="modal-actions">
                  {onAddToCart && (
                    <Button type="button" color="brand" size="xs" className="modal-btn-add" onClick={handleAddToCart}>
                      Añadir al carrito
                    </Button>
                  )}
                  {isDesigner && onEdit && (
                    <Button type="button" variant="light" color="brand" size="xs" className="modal-btn-edit" onClick={() => onEdit(product)}>
                      Editar
                    </Button>
                  )}
                  {isDesigner && onDelete && (
                    <Button type="button" variant="light" color="red" size="xs" className="modal-btn-delete" onClick={() => onDelete(product)}>
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>

              {product?.subcategory && <p className="modal-title">{product.subcategory}</p>}
              {product?.category && <p className="modal-type">{product.category}</p>}
              {product?.line && product?.line !== 'no aplica' && (
                <p className="modal-info-line">
                  <strong>Línea:</strong> {product.line}
                </p>
              )}
              <div className="modal-components-selector">
                <Text size="sm" fw={700} tt="uppercase" className="modal-variables-heading">
                  Variables
                </Text>
                {variableSlots.map(({ title, options }) => {
                  return (
                    <div key={title} className="modal-component-group">
                      <p className="modal-variable-group-label">
                        <span className="modal-variable-group-name">{title}</span>
                      </p>
                      <div className="modal-component-values">
                        {options.map((opt) => {
                          const sel = selections[title];
                          const selected =
                            sel &&
                            String(sel.value).trim() === String(opt.value).trim() &&
                            opt.refs.some((r) => String(r.componentId) === String(sel.componentId));
                          return (
                            <button
                              key={`${title}-${opt.value}`}
                              type="button"
                              className={`modal-value-chip ${selected ? 'selected' : ''}`}
                              onClick={() => handleSelect(title, opt)}
                            >
                              {opt.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Stack>
          </section>
        </div>
      </div>
    </Modal>
  );
}
