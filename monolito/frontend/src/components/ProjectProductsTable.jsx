import { useState, useEffect, useMemo } from 'react';
import { Modal, Paper, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { getMediaUrls } from '../api/documentService';
import { isSafeHttpUrl } from '../utils/safeUrl';
import { useProducts } from '../context/ProductsContext';
import { resolveProjectQuotedVariantType } from '../utils/reconcileCartItemFromCaracteristicas';
import { getVariantDisplayCodes } from '../utils/variantComponentCodes';
import { variantRowKey } from '../utils/projectWorkflowProgress';
import { useIsMobile } from '../hooks/useIsMobile';
import AssignConfirmModal from './AssignConfirmModal';
import { DescripcionEstructurada, DescripcionInlineEditable } from './project-products/ProjectProductDescriptions';
import ProjectProductsRowTail from './project-products/ProjectProductsRowTail';
import './ProjectProductsTable.css';

const EMPTY_VARIANTS = [];
const MOBILE_BREAKPOINT_PX = 768;

function notifyError(message) {
  notifications.show({ title: 'Error', message: message || 'Error', color: 'red' });
}

/**
 * Tabla de productos de un proyecto.
 * Código de variante (refs según tipología), imagen, descripción, variables sin columnas SAP por fila.
 * allowEditableComponents: cantidad, variables y comentarios en reabrir.
 */
export default function ProjectProductsTable({
  variants = EMPTY_VARIANTS,
  projectId,
  modificaciones,
  cotizadas = false,
  proceso = false,
  reopen = false,
  allowEditableComponents = false,
  projectEffective = false,
  onUpdateQuantity,
  onProductUpdate,
  onRemoveVariant,
  onQuoteClick,
  onRefresh,
  onMakeVariantEffective,
  onToggleP3P5,
  onMarkAsDesigned,
  onMarkAsDeveloped,
  isLeader = false,
  assignRoleType,
  assignees = [],
  onAssignVariant,
  assignOnly = false,
  assignRoleFilter = null,
  assigneesQuoter = [],
  assigneesDesigner = [],
  assigneesDevelopment = [],
  /** Si se define, filas no editables (solo lectura / contexto). */
  isVariantEditable,
}) {
  const getUser = (item) => item?.user || item;
  const quotersForProject = assigneesQuoter;
  const designersForProject = assigneesDesigner;
  const developersForProject = assigneesDevelopment;

  const { products } = useProducts();
  // Catálogo ya entrega variantes de proyecto autocontenidas (variables/nombres/flags).
  // Products queda solo para flujos de creación/diseño, no para render de proyecto.
  const enrichedVariants = variants;

  const [pendingAssign, setPendingAssign] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [editingQty, setEditingQty] = useState(null);
  const [qtyValue, setQtyValue] = useState('');
  const [loading, setLoading] = useState(null);
  const [expandedCaract, setExpandedCaract] = useState({}); // variantId -> bool
  const [localMods, setLocalMods] = useState({}); // variantId -> { quantity?, comments?, components?, editedComponentIds?: Record<string, true> }
  const isMobile = useIsMobile(MOBILE_BREAKPOINT_PX);
  const [mobileDetailId, setMobileDetailId] = useState(null);
  /** Prefetch de URLs de planos: enlace real <a target=_blank> (navegación de primer nivel, sin about:blank). */
  const [planUrls, setPlanUrls] = useState({});
  const [planUrlsReady, setPlanUrlsReady] = useState(false);

  const displayVariants = enrichedVariants;

  const planPdfLinkState = (planKey) => {
    if (!planKey) return null;
    if (!planUrlsReady) return { status: 'loading' };
    const u = planUrls[planKey];
    if (u && isSafeHttpUrl(u)) return { status: 'ok', href: u };
    return { status: 'err' };
  };

  useEffect(() => {
    if (!isMobile) setMobileDetailId(null);
  }, [isMobile]);

  useEffect(() => {
    if (mobileDetailId && !displayVariants.some((r) => variantRowKey(r) === mobileDetailId)) {
      setMobileDetailId(null);
    }
  }, [displayVariants, mobileDetailId]);

  // Sincronizar con modificaciones del padre al montar/re-expandir (no sobrescribir ediciones locales)
  useEffect(() => {
    if ((!modificaciones?.variantId && !modificaciones?.variantQuoteId) || !modificaciones.components) return;
    const rk = modificaciones.variantQuoteId
      ? String(modificaciones.variantQuoteId)
      : String(modificaciones.variantId);
    setLocalMods((prev) => {
      if (prev[rk]?.components) return prev;
      return { ...prev, [rk]: { ...prev[rk], ...modificaciones } };
    });
  }, [projectId, modificaciones?.variantId, modificaciones?.variantQuoteId]);

  // Limpiar localMods cuando se reabre (modificaciones se borra) para mostrar datos frescos del servidor
  useEffect(() => {
    if (!modificaciones && displayVariants.length > 0) {
      setLocalMods((prev) => {
        const rowKeys = new Set(displayVariants.map((v) => variantRowKey(v)));
        const next = { ...prev };
        let changed = false;
        for (const rk of rowKeys) {
          if (next[rk]) {
            delete next[rk];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [modificaciones, displayVariants]);

  // Cargar URLs de imágenes
  useEffect(() => {
    const keys = displayVariants.map((v) => v.baseImage).filter(Boolean);
    if (keys.length === 0) {
      setImageUrls({});
      return;
    }
    getMediaUrls(keys, 'image')
      .then((res) => res.data || {})
      .catch(() => ({}))
      .then((data) => setImageUrls(data));
  }, [displayVariants]);

  useEffect(() => {
    const keys = [...new Set(displayVariants.map((v) => v.planPdfKey).filter(Boolean))];
    if (keys.length === 0) {
      setPlanUrls({});
      setPlanUrlsReady(true);
      return;
    }
    setPlanUrlsReady(false);
    getMediaUrls(keys, 'plan')
      .then((res) => {
        setPlanUrls(res.data || {});
        setPlanUrlsReady(true);
      })
      .catch(() => {
        setPlanUrls({});
        setPlanUrlsReady(true);
      });
  }, [displayVariants]);

  // Características colapsadas por defecto (el usuario hace clic para expandir)

  const getSortCode = (v) => {
    const t = String(v.type || '').toLowerCase();
    if (t === 'p3' || t === 'p5') return v.id || '';
    return v.sapRef || v.sapCode || '';
  };
  const rows = [...displayVariants].sort((a, b) =>
    String(getSortCode(a)).localeCompare(String(getSortCode(b)), undefined, { numeric: true })
  );

  const lineMatchesModificacion = (v) => {
    if (!modificaciones) return false;
    if (modificaciones.variantQuoteId != null) {
      return String(v.variantQuoteId || '') === String(modificaciones.variantQuoteId);
    }
    if (modificaciones.variantId != null) {
      return String(v.id) === String(modificaciones.variantId);
    }
    return false;
  };

  const getVariantMods = (v) => {
    if (!lineMatchesModificacion(v)) return {};
    return localMods[variantRowKey(v)] || {};
  };
  const getEffectiveQty = (v) => (getVariantMods(v).quantity != null ? getVariantMods(v).quantity : v.quantity ?? 1);
  const getEffectiveComments = (v) => (getVariantMods(v).comments != null ? getVariantMods(v).comments : v.comments ?? '');
  const getEffectiveComponents = (v) => {
    const mods = getVariantMods(v).components;
    if (mods) return mods;
    const arr = v.components || [];
    return Object.fromEntries(arr.filter((c) => c.id).map((c) => [c.id, c.value ?? '']));
  };

  const notifyProductUpdate = (v, updates) => {
    const rk = variantRowKey(v);
    setLocalMods((prev) => ({ ...prev, [rk]: { ...prev[rk], ...updates } }));
    onProductUpdate?.(projectId, v.id, updates, v.variantQuoteId);
  };

  const handleSaveQty = async (v) => {
    const rk = variantRowKey(v);
    const qty = parseInt(qtyValue, 10);
    if (!qty || qty < 1) return;
    if (allowEditableComponents && onProductUpdate) {
      notifyProductUpdate(v, { quantity: qty });
      setEditingQty(null);
      setQtyValue('');
      return;
    }
    try {
      setLoading(rk);
      await onUpdateQuantity?.(projectId, v.id, qty, v.variantQuoteId);
      setEditingQty(null);
      onRefresh?.();
    } catch (err) {
      notifyError(err?.message || 'Error al actualizar cantidad');
    } finally {
      setLoading(null);
    }
  };

  const handleComponentInputChange = (v, c, rawValue) => {
    const updated = { ...getEffectiveComponents(v), [c.id]: rawValue };
    const newType = resolveProjectQuotedVariantType(v, updated);
    notifyProductUpdate(v, { components: updated, type: newType });
  };

  const handleRemove = (v) => {
    modals.openConfirmModal({
      title: 'Quitar del proyecto',
      children: '¿Quitar este producto del proyecto?',
      labels: { confirm: 'Quitar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          setLoading(variantRowKey(v));
          await onRemoveVariant?.(projectId, v.id, v.variantQuoteId);
          onRefresh?.();
        } catch (err) {
          notifyError(err?.message || 'Error al quitar producto');
        } finally {
          setLoading(null);
        }
      },
    });
  };

  const getVariantCodes = (v, useMods = false) => {
    const typeVal = useMods
      ? resolveProjectQuotedVariantType(v, getEffectiveComponents(v))
      : v.type;
    return getVariantDisplayCodes({
      sapRef: v.sapRef,
      sapCode: v.sapCode,
      type: typeVal,
    });
  };

  const buildDescripcionProps = (v, useMods = false) => {
    const typeVal = useMods
      ? resolveProjectQuotedVariantType(v, getEffectiveComponents(v))
      : v.type;
    const comps = useMods ? getEffectiveComponents(v) : (v.components || []).reduce((o, c) => ({ ...o, [c.id]: c.value }), {});
    const compsArr = comps ? Object.entries(comps)
      .filter(([, val]) => val)
      .map(([cid, val]) => {
        const comp = (v.components || []).find((c) => c && (c.id === cid || String(c.id) === String(cid)));
        const name = comp?.name ?? cid;
        return { name, val, codes: null };
      })
      : [];
    const commentsVal = useMods ? getEffectiveComments(v) : v.comments;
    return {
      variant: v,
      typeVal: typeVal ?? v.type,
      compsArr,
      commentsVal,
      caractExpanded: expandedCaract[variantRowKey(v)],
      onToggleCaract: () =>
        setExpandedCaract((prev) => {
          const rk = variantRowKey(v);
          return { ...prev, [rk]: !prev[rk] };
        }),
    };
  };

  const variantEditableFor = (v) => (isVariantEditable == null ? true : !!isVariantEditable(v));

  const renderRowTail = (v) => (
    <ProjectProductsRowTail
      v={v}
      rowKey={variantRowKey(v)}
      projectId={projectId}
      variantEditable={variantEditableFor(v)}
      cotizadas={cotizadas}
      proceso={proceso}
      reopen={reopen}
      assignOnly={assignOnly}
      projectEffective={projectEffective}
      allowEditableComponents={allowEditableComponents}
      onProductUpdate={onProductUpdate}
      onUpdateQuantity={onUpdateQuantity}
      editingQty={editingQty}
      qtyValue={qtyValue}
      setQtyValue={setQtyValue}
      setEditingQty={setEditingQty}
      getEffectiveQty={getEffectiveQty}
      handleSaveQty={handleSaveQty}
      loading={loading}
      handleRemove={handleRemove}
      onRemoveVariant={onRemoveVariant}
      pendingAssign={pendingAssign}
      setPendingAssign={setPendingAssign}
      assignRoleFilter={assignRoleFilter}
      quotersForProject={quotersForProject}
      designersForProject={designersForProject}
      developersForProject={developersForProject}
      getUser={getUser}
      onQuoteClick={onQuoteClick}
      onMakeVariantEffective={onMakeVariantEffective}
      onToggleP3P5={onToggleP3P5}
      onMarkAsDesigned={onMarkAsDesigned}
      onMarkAsDeveloped={onMarkAsDeveloped}
      onRefresh={onRefresh}
      planPdfLink={planPdfLinkState(v.planPdfKey)}
      isLeader={isLeader}
      assignRoleType={assignRoleType}
      assignees={assignees}
      onAssignVariant={onAssignVariant}
    />
  );

  const renderCodigoBlock = (v, canEdit) => (
    <div className="col-codigo">
      {(() => {
        const codes = getVariantCodes(v, canEdit);
        if (!codes?.primary) return <span className="codigo-empty">—</span>;
        return codes.secondary ? (
          <div className="codigo-stack codigo-stack-fixed" title="SAP y modelo">
            <span className="codigo-sap">{codes.secondary}</span>
            <span className="codigo-ref">{codes.primary}</span>
          </div>
        ) : (
          <span className="codigo-ref codigo-ref-only codigo-ref-single" title="SAP o modelo">
            {codes.primary}
          </span>
        );
      })()}
    </div>
  );

  const renderImagenBlock = (v, imgUrl) => (
    <div className="col-imagen">
      {imgUrl ? (
        <img src={imgUrl} alt="" className="product-thumb" />
      ) : (
        <div className="product-thumb-placeholder">Sin imagen</div>
      )}
    </div>
  );

  const renderDescripcionBlock = (v, listSummaryOnly) => {
    const canEdit = allowEditableComponents && onProductUpdate;
    const typeValInline = canEdit
      ? resolveProjectQuotedVariantType(v, getEffectiveComponents(v))
      : v.type;
    return (
      <div className="col-descripcion">
        {cotizadas && canEdit && !listSummaryOnly ? (
          <DescripcionInlineEditable
            variant={v}
            typeVal={typeValInline}
            getEffectiveComponents={getEffectiveComponents}
            getEffectiveComments={getEffectiveComments}
            onComponentChange={handleComponentInputChange}
            onCommentsChange={(vRow, text) => notifyProductUpdate(vRow, { comments: text })}
            products={products}
          />
        ) : canEdit && listSummaryOnly ? (
          <DescripcionEstructurada {...buildDescripcionProps(v, true)} listSummaryOnly />
        ) : (
          <DescripcionEstructurada {...buildDescripcionProps(v)} listSummaryOnly={listSummaryOnly} />
        )}
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <Paper p="lg" radius="md" withBorder className="project-products-empty-wrap">
        <Text size="sm" c="dimmed">
          No hay productos en este proyecto
        </Text>
      </Paper>
    );
  }

  const mobileDetailVariant = mobileDetailId ? rows.find((r) => variantRowKey(r) === mobileDetailId) : null;

  return (
    <Paper component="div" className="project-products-table-wrap" role="region" aria-label="Productos del proyecto" p={0} radius="md">
      <div className="project-products-header">
        <span className="col-codigo">Código</span>
        <span className="col-imagen">Imagen</span>
        <span className="col-descripcion">Descripción</span>
        <span className="project-products-header-desktop-only col-cantidad">Cantidad</span>
        <span className="project-products-header-desktop-only col-valor project-products-header-label-tight">
          Valor Unidad
        </span>
        <span className="project-products-header-desktop-only col-valor-total">Valor total</span>
        <span className="project-products-header-desktop-only col-tiempo project-products-header-label-tight">
          Días elaboración
        </span>
        <span className="project-products-header-desktop-only col-material">Material crítico</span>
        {assignOnly && (
          <>
            {(!assignRoleFilter || assignRoleFilter === 'QUOTER') && <span className="project-products-header-desktop-only col-asignar">Cotizador</span>}
            {(!assignRoleFilter || assignRoleFilter === 'DESIGNER') && <span className="project-products-header-desktop-only col-asignar">Diseñador</span>}
            {(!assignRoleFilter || assignRoleFilter === 'DEVELOPMENT') && <span className="project-products-header-desktop-only col-asignar">Desarrollo</span>}
          </>
        )}
        {(cotizadas || proceso || onMarkAsDesigned || onMarkAsDeveloped) && !assignOnly && <span className="project-products-header-desktop-only col-acciones">Acciones</span>}
      </div>
      <div className="project-products-body">
        {rows.map((v) => {
          const imgUrl = v.baseImage ? imageUrls[v.baseImage] : null;
          const canEdit = allowEditableComponents && onProductUpdate;
          const rowLocked = !variantEditableFor(v);

          const rk = variantRowKey(v);
          return (
            <div
              key={rk}
              className={`project-products-row${isMobile ? ' project-products-row--mobile' : ''}${rowLocked ? ' project-products-row--locked' : ''}`}
            >
              {isMobile ? (
                <div
                  className="project-products-mobile-hit"
                  role="button"
                  tabIndex={0}
                  onClick={() => setMobileDetailId(variantRowKey(v))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setMobileDetailId(variantRowKey(v));
                    }
                  }}
                  aria-label="Ver detalle del producto"
                >
                  {renderCodigoBlock(v, canEdit)}
                  {renderImagenBlock(v, imgUrl)}
                  {renderDescripcionBlock(v, true)}
                  <span className="project-products-mobile-hit-chevron" aria-hidden>›</span>
                </div>
              ) : (
                <>
                  {renderCodigoBlock(v, canEdit)}
                  {renderImagenBlock(v, imgUrl)}
                  {renderDescripcionBlock(v, false)}
                  {renderRowTail(v)}
                </>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        opened={Boolean(isMobile && mobileDetailVariant)}
        onClose={() => setMobileDetailId(null)}
        closeOnClickOutside={false}
        fullScreen
        zIndex={10050}
        title="Detalle del producto"
        classNames={{
          header: 'project-product-mobile-modal-header',
          title: 'project-product-mobile-modal-title',
          body: 'project-product-mobile-modal-body-reset',
        }}
        styles={{
          header: {
            background: 'var(--color-primary)',
            color: 'white',
            marginBottom: 0,
          },
          close: { color: 'white' },
        }}
      >
        {mobileDetailVariant && (
          <div className="project-product-mobile-modal-scroll">
            <div className="ppm-modal-hero">
              {renderImagenBlock(
                mobileDetailVariant,
                mobileDetailVariant.baseImage ? imageUrls[mobileDetailVariant.baseImage] : null
              )}
              {renderCodigoBlock(mobileDetailVariant, allowEditableComponents && !!onProductUpdate)}
            </div>
            {renderDescripcionBlock(mobileDetailVariant, false)}
            <div className="ppm-modal-stack">{renderRowTail(mobileDetailVariant)}</div>
          </div>
        )}
      </Modal>
      {assignOnly && (
        <AssignConfirmModal
          visible={!!pendingAssign}
          assigneeName={pendingAssign?.assigneeName}
          count={pendingAssign?.count}
          onConfirm={async () => {
            if (!pendingAssign) return;
            try {
              await onAssignVariant?.(projectId, pendingAssign.lineId, pendingAssign.assigneeId, pendingAssign.roleType);
              onRefresh?.();
            } catch (err) {
              notifyError(err?.message || 'Error al asignar');
            } finally {
              setPendingAssign(null);
            }
          }}
          onCancel={() => setPendingAssign(null)}
        />
      )}
    </Paper>
  );
}
