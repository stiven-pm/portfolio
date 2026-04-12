import { useReducer, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Group, Modal, NumberInput, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUser } from '../../context/UserContext';
import { invalidateNavSidebarBadges } from '../../utils/invalidateNavBadges';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import {
  countPendingInProject,
  projectFullyQuoted,
  projectProgressLabel,
  variantRowKey,
} from '../../utils/projectWorkflowProgress';
import './Proyectos.css';

const initialState = {
  projects: [],
  loading: true,
  activeTab: 'proceso',
  searchText: '',
  expandedId: null,
  editingVariant: null,
};

function cotizadorReducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_TEXT':
      return { ...state, searchText: action.payload };
    case 'SET_EXPANDED_ID':
      return { ...state, expandedId: action.payload };
    case 'SET_EDITING_VARIANT':
      return { ...state, editingVariant: action.payload };
    default:
      return state;
  }
}

function filterCotizadorList(projects, activeTab, searchText, userId) {
  const uid = String(userId || '');
  const iAmOnProject = (p) =>
    (p.variants || []).some((v) => String(v.assignedQuoterId || '') === uid);
  const base =
    activeTab === 'proceso'
      ? projects.filter((p) => iAmOnProject(p) && (!projectFullyQuoted(p) || p.reopen))
      : projects.filter((p) => iAmOnProject(p) && projectFullyQuoted(p) && !p.reopen);
  const q = searchText.trim().toLowerCase();
  return base.filter((p) => (p.consecutive || p.name || '').toLowerCase().includes(q));
}

function CotizadorList({
  filtered,
  searchText,
  activeTab,
  selectedId,
  setSelectedId,
  userId,
}) {
  if (filtered.length === 0) {
    return (
      <p className="cotizador-empty">
        {searchText.trim()
          ? 'No se encontraron proyectos'
          : activeTab === 'proceso'
            ? 'No hay proyectos en proceso'
            : 'No hay proyectos cotizados'}
      </p>
    );
  }
  return (
    <div className="cotizador-sidebar-list">
      {filtered.map((p) => {
        const isSelected = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`cotizador-sidebar-item ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="cotizador-consecutivo">{p.consecutive || 'S/C'}</span>
            <span className="cotizador-sidebar-client">
              {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
            </span>
            <div className="cotizador-sidebar-badges">
              {(() => {
                const pending = countPendingInProject('cotizador', p, userId);
                return pending > 0 ? (
                  <span className="cotizador-pending-badge" title={`${pending} pendiente(s)`}>
                    {pending > 99 ? '99+' : pending}
                  </span>
                ) : null;
              })()}
              {(() => {
                const pr = projectProgressLabel('cotizador', p);
                return pr ? <span className="cotizador-progress">{pr}</span> : null;
              })()}
              {p.quoted && !p.reopen && <span className="cotizador-tag">✓ Cotizado</span>}
              {p.effective && <span className="cotizador-effective-tag"> (Efectivo)</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function CotizadorProyectos() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const catalog = useCatalogService();
  const [state, dispatch] = useReducer(cotizadorReducer, initialState);
  const { projects, loading, activeTab, searchText, expandedId, editingVariant } = state;

  useEffect(() => {
    if (user?.id) {
      catalog
        .getProjectsByAssignedQuoter(user.id)
        .then((data) => dispatch({ type: 'SET_PROJECTS', payload: data }))
        .catch(() => dispatch({ type: 'SET_PROJECTS', payload: [] }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: false }));
    }
  }, [user?.id]);

  const uid = user?.id;
  const iAmOnProject = (p) =>
    (p.variants || []).some((v) => String(v.assignedQuoterId || '') === String(uid || ''));
  const enProceso = projects.filter((p) => iAmOnProject(p) && (!projectFullyQuoted(p) || p.reopen));
  const cotizados = projects.filter((p) => iAmOnProject(p) && projectFullyQuoted(p) && !p.reopen);

  const filtered = filterCotizadorList(projects, activeTab, searchText, uid);

  useEffect(() => {
    if (expandedId == null) return;
    if (!filterCotizadorList(projects, activeTab, searchText, user?.id).some((p) => p.id === expandedId)) {
      dispatch({ type: 'SET_EXPANDED_ID', payload: null });
    }
  }, [expandedId, activeTab, searchText, projects, user?.id]);

  const refreshProjects = () => {
    if (user?.id) {
      catalog.getProjectsByAssignedQuoter(user.id).then((data) => {
        dispatch({ type: 'SET_PROJECTS', payload: data });
        invalidateNavSidebarBadges(queryClient);
      });
    }
  };

  const handleQuoteVariant = async (projectId, variantId, variantQuoteId, price, elaborationTime, criticalMaterial) => {
    try {
      await catalog.quoteVariant({
        projectId,
        variantId,
        variantQuoteId: variantQuoteId ?? undefined,
        quoterId: user.id,
        price: parseInt(price, 10) || 0,
        elaborationTime: parseInt(elaborationTime, 10) || 0,
        criticalMaterial: criticalMaterial?.trim() || null,
      });
      dispatch({ type: 'SET_EDITING_VARIANT', payload: null });
      refreshProjects();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err?.message || 'Error al cotizar',
        color: 'red',
      });
    }
  };

  const handleToggleP3P5 = async (projectId, variantId, variantQuoteId) => {
    try {
      await catalog.toggleP3P5(projectId, variantId, variantQuoteId);
      refreshProjects();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err?.message || 'Error al alternar P3/P5',
        color: 'red',
      });
    }
  };

  const selectedProject = projects.find((p) => p.id === expandedId);
  const isCotizadosTab = activeTab === 'cotizados';

  const [quotePrice, setQuotePrice] = useState('');
  const [quoteTime, setQuoteTime] = useState('');
  const [quoteCritical, setQuoteCritical] = useState('');

  useEffect(() => {
    if (!editingVariant) return;
    setQuotePrice(editingVariant.price != null ? String(editingVariant.price) : '');
    setQuoteTime(editingVariant.elaborationTime != null ? String(editingVariant.elaborationTime) : '');
    setQuoteCritical(editingVariant.criticalMaterial?.trim() ? editingVariant.criticalMaterial : '');
  }, [editingVariant]);

  const closeQuoteModal = () => dispatch({ type: 'SET_EDITING_VARIANT', payload: null });

  return (
    <div className={`cotizador-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="cotizador-sidebar">
        <div className="cotizador-sidebar-header">
          <div className="cotizador-search">
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchText}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TEXT', payload: e.target.value })}
            />
          </div>

          <div className="cotizador-tabs">
            <button
              type="button"
              className={activeTab === 'proceso' ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'proceso' })}
            >
              Proceso ({enProceso.length})
            </button>
            <button
              type="button"
              className={activeTab === 'cotizados' ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'cotizados' })}
            >
              Cotizados ({cotizados.length})
            </button>
          </div>
        </div>

        <div className="cotizador-sidebar-content">
          {loading ? (
            <p className="cotizador-loading">Cargando...</p>
          ) : (
            <CotizadorList
              filtered={filtered}
              searchText={searchText}
              activeTab={activeTab}
              selectedId={expandedId}
              setSelectedId={(id) => dispatch({ type: 'SET_EXPANDED_ID', payload: id })}
              userId={user?.id}
            />
          )}
        </div>
      </div>

      <div className="cotizador-main">
        {selectedProject ? (
          <div className="cotizador-detail-view">
            <div className="cotizador-detail-header">
              <button
                type="button"
                className="cotizador-back-btn"
                onClick={() => dispatch({ type: 'SET_EXPANDED_ID', payload: null })}
              >
                ← Volver
              </button>
              <div className="cotizador-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="cotizador-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                  <p><strong>Total:</strong> ${(selectedProject.totalCost ?? 0).toLocaleString()}</p>
                </div>
                <div className="cotizador-badges">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              isVariantEditable={(v) => String(v.assignedQuoterId || '') === String(user?.id || '')}
              proceso={!isCotizadosTab}
              cotizadas={isCotizadosTab}
              reopen={selectedProject.reopen}
              onQuoteClick={(v) =>
                dispatch({
                  type: 'SET_EDITING_VARIANT',
                  payload:
                    editingVariant && variantRowKey(editingVariant) === variantRowKey(v)
                      ? null
                      : { ...v, projectId: selectedProject.id },
                })
              }
              onToggleP3P5={handleToggleP3P5}
              onRefresh={refreshProjects}
            />
          </div>
        ) : (
          <div className="cotizador-no-selection">
            <span className="selection-icon">💰</span>
            <p>Selecciona un proyecto de la lista para gestionar la cotización</p>
          </div>
        )}
      </div>

      <Modal
        opened={!!editingVariant}
        onClose={closeQuoteModal}
        closeOnClickOutside={false}
        title="Cotizar variante"
        centered
      >
        <Stack gap="sm">
          <NumberInput
            label="Precio"
            placeholder="0"
            min={0}
            value={quotePrice === '' ? '' : Number(quotePrice)}
            onChange={(v) => setQuotePrice(v === '' || v === undefined ? '' : String(v))}
          />
          <NumberInput
            label="Tiempo elaboración (días)"
            placeholder="0"
            min={0}
            value={quoteTime === '' ? '' : Number(quoteTime)}
            onChange={(v) => setQuoteTime(v === '' || v === undefined ? '' : String(v))}
          />
          <TextInput
            label="Material crítico"
            placeholder="Opcional"
            value={quoteCritical}
            onChange={(e) => setQuoteCritical(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeQuoteModal}>
              Cancelar
            </Button>
            <Button
              color="brand"
              onClick={() => {
                if (!editingVariant) return;
                handleQuoteVariant(
                  editingVariant.projectId,
                  editingVariant.id,
                  editingVariant.variantQuoteId,
                  quotePrice,
                  quoteTime,
                  quoteCritical
                );
              }}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </Modal>

    </div>
  );
}
