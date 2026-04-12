import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useUser } from '../../context/UserContext';
import { invalidateNavSidebarBadges } from '../../utils/invalidateNavBadges';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import {
  countPendingInProject,
  projectFullyDesigned,
  projectProgressLabel,
} from '../../utils/projectWorkflowProgress';
import './Proyectos.css';

export default function DisenadorProyectos() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const catalog = useCatalogService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('proceso');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    catalog
      .getProjectsByAssignedDesigner(user.id)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const load = (bumpNav = false) => {
    if (!user?.id) return;
    catalog
      .getProjectsByAssignedDesigner(user.id)
      .then((data) => {
        setProjects(data);
        if (bumpNav) invalidateNavSidebarBadges(queryClient);
      })
      .catch(() => setProjects([]));
  };

  const uid = String(user?.id || '');
  const iAmOnProject = (p) =>
    (p.variants || []).some((v) => String(v.assignedDesignerId || '') === uid);
  const enProceso = projects.filter((p) => iAmOnProject(p) && !projectFullyDesigned(p));
  const diseñados = projects.filter((p) => iAmOnProject(p) && projectFullyDesigned(p));

  const filtered =
    activeTab === 'proceso'
      ? enProceso.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        )
      : diseñados.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        );

  const selectedProject = projects.find((p) => p.id === expandedId);

  return (
    <div className={`disenador-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="disenador-sidebar">
        <div className="disenador-sidebar-header">
          <p className="disenador-desc">Diseños asignados</p>
          <div className="disenador-search">
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="disenador-tabs">
            <button
              type="button"
              className={activeTab === 'proceso' ? 'active' : ''}
              onClick={() => setActiveTab('proceso')}
            >
              Proceso ({enProceso.length})
            </button>
            <button
              type="button"
              className={activeTab === 'diseñados' ? 'active' : ''}
              onClick={() => setActiveTab('diseñados')}
            >
              Diseñados ({diseñados.length})
            </button>
          </div>
        </div>

        <div className="disenador-sidebar-content">
          {loading ? (
            <p className="disenador-loading">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="disenador-empty">No hay proyectos</p>
          ) : (
            <div className="disenador-sidebar-list">
              {filtered.map((p) => {
                const isSelected = expandedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`disenador-sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpandedId(p.id)}
                  >
                    <span className="disenador-consecutivo">{p.consecutive || 'S/C'}</span>
                    <span className="disenador-sidebar-client">
                      {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
                    </span>
                    <span className="disenador-sidebar-badges">
                      {(() => {
                        const pending = countPendingInProject('disenador', p, user?.id);
                        return pending > 0 ? (
                          <span className="disenador-pending-badge" title={`${pending} pendiente(s)`}>
                            {pending > 99 ? '99+' : pending}
                          </span>
                        ) : null;
                      })()}
                      {(() => {
                        const pr = projectProgressLabel('disenador', p);
                        return pr ? <span className="disenador-sidebar-progress">{pr}</span> : null;
                      })()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="disenador-main">
        {selectedProject ? (
          <div className="disenador-detail-view">
            <div className="disenador-detail-header">
              <button
                type="button"
                className="disenador-back-btn"
                onClick={() => setExpandedId(null)}
              >
                ← Volver
              </button>
              <div className="disenador-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="disenador-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                </div>
                <div className="disenador-badges">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              isVariantEditable={(v) => String(v.assignedDesignerId || '') === String(user?.id || '')}
              onMarkAsDesigned={activeTab === 'proceso' && user?.id ? async (projectId, variantId, planPdfKey, variantQuoteId) => {
                try {
                  await catalog.markVariantAsDesigned(projectId, variantId, user.id, planPdfKey, variantQuoteId);
                  load(true);
                } catch (err) {
                  notifications.show({
                    title: 'Error',
                    message: err?.message || 'Error al marcar diseñado',
                    color: 'red',
                  });
                }
              } : undefined}
              onRefresh={() => load(true)}
            />
          </div>
        ) : (
          <div className="disenador-no-selection">
            <span className="selection-icon">🎨</span>
            <p>Selecciona un proyecto para gestionar diseños</p>
          </div>
        )}
      </div>
    </div>
  );
}
