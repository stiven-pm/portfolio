import { modals } from '@mantine/modals';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import MarkDesignedModalBody from './MarkDesignedModalBody';

/** Enlace <a> con URL ya resuelta (prefetch); evita about:blank + location (ORB / pestaña vacía). */
function PlanPdfLinkButton({ link, className = 'btn-plan-pdf', assignLayout = false }) {
  const cls = assignLayout ? `${className} btn-plan-pdf--assign` : className;
  if (!link) return null;
  if (link.status === 'ok') {
    return (
      <Button
        component="a"
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        type="button"
        size="xs"
        variant="light"
        color="brand"
        className={cls}
        title="Abrir PDF de planos"
      >
        Ver planos
      </Button>
    );
  }
  if (link.status === 'loading') {
    return (
      <Button type="button" size="xs" variant="light" color="brand" className={cls} disabled title="Obteniendo enlace…">
        Ver planos
      </Button>
    );
  }
  return (
    <Button
      type="button"
      size="xs"
      variant="light"
      color="brand"
      className={cls}
      disabled
      title="Sin enlace válido (HOST_IP / MinIO o clave del plano)"
    >
      Ver planos
    </Button>
  );
}

/**
 * Columnas de cantidad, precio, tiempo, asignación y acciones (tabla proyecto).
 */
export default function ProjectProductsRowTail({
  v,
  rowKey,
  projectId,
  variantEditable = true,
  cotizadas,
  proceso,
  reopen,
  assignOnly,
  projectEffective,
  allowEditableComponents,
  onProductUpdate,
  onUpdateQuantity,
  editingQty,
  qtyValue,
  setQtyValue,
  setEditingQty,
  getEffectiveQty,
  handleSaveQty,
  loading,
  handleRemove,
  onRemoveVariant,
  pendingAssign,
  setPendingAssign,
  assignRoleFilter,
  quotersForProject,
  designersForProject,
  developersForProject,
  getUser,
  onQuoteClick,
  onMakeVariantEffective,
  onToggleP3P5,
  onMarkAsDesigned,
  onMarkAsDeveloped,
  onRefresh,
  planPdfLink,
  isLeader,
  assignRoleType,
  assignees,
  onAssignVariant,
}) {
  const qty = getEffectiveQty(v);
  const price = v.price ?? 0;
  const lineTotal = price * qty;
  const time = v.elaborationTime ?? 0;
  const rk = rowKey ?? v.variantQuoteId ?? v.id;
  const isEditing = editingQty === rk;
  const canEdit = allowEditableComponents && onProductUpdate;

  const quoterData = [
    { value: '', label: '—' },
    ...quotersForProject.map((item) => {
      const u = getUser(item);
      const cnt = item?.projects ?? 0;
      const label =
        cnt != null
          ? `${u?.name || u?.email || '—'} (${cnt})`
          : u?.name || u?.email || '—';
      return { value: String(u?.id || item.id), label };
    }),
  ];

  const designerData = [
    { value: '', label: '—' },
    ...designersForProject.map((item) => {
      const u = getUser(item);
      const cnt = item?.created ?? item?.edited ?? 0;
      const label =
        cnt != null
          ? `${u?.name || u?.email || '—'} (${cnt})`
          : u?.name || u?.email || '—';
      return { value: String(u?.id || item.id), label };
    }),
  ];

  const devData = [
    { value: '', label: '—' },
    ...developersForProject.map((item) => {
      const u = getUser(item);
      return { value: String(u?.id || item.id), label: u?.name || u?.email || '—' };
    }),
  ];

  const leaderAssignData = [
    { value: '', label: 'Asignar...' },
    ...assignees.map((a) => ({ value: String(a.id), label: a.name || a.email })),
  ];

  return (
    <>
      <div className="col-cantidad">
        {cotizadas && variantEditable && (onUpdateQuantity || canEdit) ? (
          isEditing ? (
            <Group gap={4} wrap="nowrap" className="qty-edit">
              <NumberInput
                size="xs"
                min={1}
                hideControls
                w={72}
                value={qtyValue === '' ? '' : Number(qtyValue)}
                onChange={(val) => setQtyValue(val === '' || val === undefined ? '' : String(val))}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveQty(v)}
              />
              <ActionIcon
                size="sm"
                variant="filled"
                color="brand"
                aria-label="Guardar cantidad"
                onClick={() => handleSaveQty(v)}
                disabled={loading === rk}
              >
                ✓
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="light"
                color="gray"
                aria-label="Cancelar"
                onClick={() => {
                  setEditingQty(null);
                  setQtyValue('');
                }}
              >
                ✕
              </ActionIcon>
            </Group>
          ) : (
            <Button
              type="button"
              size="xs"
              variant="subtle"
              color="brand"
              className="btn-edit-qty"
              onClick={() => {
                setEditingQty(rk);
                setQtyValue(String(getEffectiveQty(v)));
              }}
              title="Editar cantidad"
            >
              {qty}
            </Button>
          )
        ) : (
          qty
        )}
      </div>
      <div className="col-valor">{price ? `$ ${price.toLocaleString()} COP` : '-'}</div>
      <div className="col-valor-total">${lineTotal.toLocaleString()} COP</div>
      <div className="col-tiempo">{time ? `${time} días` : '-'}</div>
      <div className="col-material">
        <span>{v.criticalMaterial || '-'}</span>
      </div>
      {assignOnly && (
        <>
          {(!assignRoleFilter || assignRoleFilter === 'QUOTER') && (
            <div className="col-asignar" data-mobile-label="Cotizador">
              <Select
                size="xs"
                className="btn-assign-select"
                data={quoterData}
                value={
                  pendingAssign?.lineId === (v.variantQuoteId || v.id)
                    ? String(pendingAssign.assigneeId)
                    : v.assignedQuoterId
                      ? String(v.assignedQuoterId)
                      : ''
                }
                onChange={(assigneeId) => {
                  if (!assigneeId) return;
                  const item = quotersForProject.find((q) => String(getUser(q)?.id || q.id) === assigneeId);
                  const u = getUser(item);
                  setPendingAssign({
                    lineId: v.variantQuoteId || v.id,
                    roleType: 'QUOTER',
                    assigneeId,
                    assigneeName: u?.name || u?.email || '—',
                    count: item?.projects ?? null,
                  });
                }}
                disabled={!!v.assignedQuoterId}
                title={
                  v.assignedQuoterId
                    ? 'Ya asignado (no se puede cambiar)'
                    : 'Asignar cotizador (solo de la región del proyecto)'
                }
              />
            </div>
          )}
          {(!assignRoleFilter || assignRoleFilter === 'DESIGNER') && (
            <div className="col-asignar col-asignar--stack" data-mobile-label="Diseñador">
              <Stack gap={6} w="100%" align="stretch">
                {v.planPdfKey ? <PlanPdfLinkButton link={planPdfLink} assignLayout /> : null}
                <Select
                  size="xs"
                  className="btn-assign-select"
                  data={designerData}
                  value={
                    pendingAssign?.lineId === (v.variantQuoteId || v.id)
                      ? String(pendingAssign.assigneeId)
                      : v.assignedDesignerId
                        ? String(v.assignedDesignerId)
                        : ''
                  }
                  onChange={(assigneeId) => {
                    if (!assigneeId) return;
                    const item = designersForProject.find((d) => String(getUser(d)?.id || d.id) === assigneeId);
                    const u = getUser(item);
                    setPendingAssign({
                      lineId: v.variantQuoteId || v.id,
                      roleType: 'DESIGNER',
                      assigneeId,
                      assigneeName: u?.name || u?.email || '—',
                      count: item?.created ?? item?.edited ?? null,
                    });
                  }}
                  disabled={!!v.assignedDesignerId}
                  title={
                    v.assignedDesignerId
                      ? 'Ya asignado (no se puede cambiar)'
                      : 'Asignar diseñador (solo de la región del proyecto)'
                  }
                />
              </Stack>
            </div>
          )}
          {(!assignRoleFilter || assignRoleFilter === 'DEVELOPMENT') && (
            <div className="col-asignar" data-mobile-label="Desarrollo">
              <Group gap={6} wrap="nowrap" align="center" justify="center" w="100%" className="col-asignar-dev-inner">
                {v.planPdfKey ? <PlanPdfLinkButton link={planPdfLink} assignLayout /> : null}
                <Select
                  size="xs"
                  className="btn-assign-select btn-assign-select--with-plan"
                  data={devData}
                  value={
                    pendingAssign?.lineId === (v.variantQuoteId || v.id)
                      ? String(pendingAssign.assigneeId)
                      : v.assignedDevelopmentUserId
                        ? String(v.assignedDevelopmentUserId)
                        : ''
                  }
                  onChange={(assigneeId) => {
                    if (!assigneeId) return;
                    const item = developersForProject.find((d) => String(getUser(d)?.id || d.id) === assigneeId);
                    const u = getUser(item);
                    setPendingAssign({
                      lineId: v.variantQuoteId || v.id,
                      roleType: 'DEVELOPMENT',
                      assigneeId,
                      assigneeName: u?.name || u?.email || '—',
                      count: null,
                    });
                  }}
                  disabled={!!v.assignedDevelopmentUserId}
                  title={
                    v.assignedDevelopmentUserId
                      ? 'Ya asignado (no se puede cambiar)'
                      : 'Asignar desarrollo (solo de la región del proyecto)'
                  }
                />
              </Group>
            </div>
          )}
        </>
      )}
      {(cotizadas || proceso || onMarkAsDesigned || onMarkAsDeveloped) && !assignOnly && (
        <div className="col-acciones">
          {!variantEditable ? (
            <Text size="xs" c="dimmed" className="project-row-readonly-hint" title="Producto de contexto (asignado a otro)">
              Solo lectura
            </Text>
          ) : (
          <Group gap={6} wrap="wrap" justify="flex-end">
            {proceso && onQuoteClick && (reopen || v.price == null) ? (
              <Button
                type="button"
                size="xs"
                variant="filled"
                color="brand"
                className="btn-quote"
                onClick={() => onQuoteClick(v)}
                title="Cotizar"
              >
                Cotizar
              </Button>
            ) : cotizadas && projectEffective && onMakeVariantEffective ? (
              <Button
                type="button"
                size="xs"
                variant={v.effective ? 'filled' : 'light'}
                color={v.effective ? 'green' : 'brand'}
                className={v.effective ? 'btn-effective-on' : 'btn-effective-off'}
                onClick={() => onMakeVariantEffective(projectId, v.id, !v.effective, v.variantQuoteId)}
                disabled={loading === rk}
                title={v.effective ? 'Marcado efectivo' : 'Marcar efectivo'}
              >
                {v.effective ? '✓ Efectivo' : 'Marcar efectivo'}
              </Button>
            ) : cotizadas && onRemoveVariant ? (
              <Button
                type="button"
                size="xs"
                variant="light"
                color="red"
                className="btn-remove"
                onClick={() => handleRemove(v)}
                disabled={loading === rk}
                title="Quitar del proyecto"
              >
                Quitar
              </Button>
            ) : null}
            {onToggleP3P5 && (v.type === 'p3' || v.type === 'p5') && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                color="gray"
                className="btn-toggle-p3p5"
                onClick={() => onToggleP3P5(projectId, v.id, v.variantQuoteId)}
                disabled={loading === rk}
                title="Alternar P3 ↔ P5"
              >
                P3↔P5
              </Button>
            )}
            {v.planPdfKey ? <PlanPdfLinkButton link={planPdfLink} /> : null}
            {onMarkAsDesigned && v.quotedAt && !v.designedAt && (
              <Button
                type="button"
                size="xs"
                variant="filled"
                color="brand"
                className="btn-mark-designed"
                onClick={() => {
                  modals.open({
                    title: 'Marcar como diseñado',
                    children: (
                      <MarkDesignedModalBody
                        onSubmit={async (planPdfKey) => {
                          await onMarkAsDesigned(projectId, v.id, planPdfKey, v.variantQuoteId);
                          modals.closeAll();
                          onRefresh?.();
                        }}
                      />
                    ),
                  });
                }}
                disabled={loading === rk}
                title="Marcar como diseñado"
              >
                Marcar diseñado
              </Button>
            )}
            {onMarkAsDeveloped && v.designedAt && !v.developedAt && (
              <Button
                type="button"
                size="xs"
                variant="filled"
                color="brand"
                className="btn-mark-developed"
                onClick={() => {
                  modals.openConfirmModal({
                    title: '¿Marcar como desarrollado?',
                    children: <Text size="sm">Se registrará la variante como desarrollada.</Text>,
                    labels: { confirm: 'Confirmar', cancel: 'Cancelar' },
                    onConfirm: async () => {
                      await onMarkAsDeveloped(projectId, v.id, v.variantQuoteId);
                      onRefresh?.();
                    },
                  });
                }}
                disabled={loading === rk}
                title="Marcar como desarrollado"
              >
                Marcar desarrollado
              </Button>
            )}
            {onMarkAsDeveloped && v.developedAt && (
              <Badge size="sm" color="green" variant="light" className="desarrollo-done">
                ✓ Desarrollado
              </Badge>
            )}
            {isLeader && assignRoleType && assignees.length > 0 && onAssignVariant && (
              <Select
                size="xs"
                className="btn-assign-select"
                data={leaderAssignData}
                value={
                  assignRoleType === 'QUOTER'
                    ? String(v.assignedQuoterId || '')
                    : assignRoleType === 'DESIGNER'
                      ? String(v.assignedDesignerId || '')
                      : String(v.assignedDevelopmentUserId || '')
                }
                onChange={(assigneeId) => {
                  if (assigneeId) onAssignVariant(projectId, v.variantQuoteId || v.id, assigneeId, assignRoleType);
                }}
                title={`Asignar ${assignRoleType === 'QUOTER' ? 'cotizador' : assignRoleType === 'DESIGNER' ? 'diseñador' : 'desarrollo'}`}
              />
            )}
          </Group>
          )}
        </div>
      )}
    </>
  );
}
