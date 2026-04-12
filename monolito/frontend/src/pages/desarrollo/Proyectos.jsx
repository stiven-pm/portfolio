import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useUser } from '../../context/UserContext';
import { invalidateNavSidebarBadges } from '../../utils/invalidateNavBadges';
import { useCatalogService } from '../../hooks/useCatalogService';
import ProjectProductsTable from '../../components/ProjectProductsTable';
import {
  countPendingInProject,
  projectFullyDeveloped,
  projectProgressLabel,
} from '../../utils/projectWorkflowProgress';
import './Proyectos.css';

export default function DesarrolloProyectos() {
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
      .getProjectsByAssignedDevelopment(user.id)
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const load = (bumpNav = false) => {
    if (!user?.id) return;
    catalog
      .getProjectsByAssignedDevelopment(user.id)
      .then((data) => {
        setProjects(data || []);
        if (bumpNav) invalidateNavSidebarBadges(queryClient);
      })
      .catch(() => setProjects([]));
  };

  const uid = String(user?.id || '');
  const iAmOnProject = (p) =>
    (p.variants || []).some((v) => String(v.assignedDevelopmentUserId || '') === uid);
  const enProceso = projects.filter((p) => iAmOnProject(p) && !projectFullyDeveloped(p));
  const desarrollados = projects.filter((p) => iAmOnProject(p) && projectFullyDeveloped(p));

  const filtered =
    activeTab === 'proceso'
      ? enProceso.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        )
      : desarrollados.filter((p) =>
          (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
        );

  const selectedProject = projects.find((p) => p.id === expandedId);

  return (
    <div className={`desarrollo-page master-detail${expandedId != null ? ' master-detail--detail-open' : ''}`}>
      <div className="desarrollo-sidebar">
        <div className="desarrollo-sidebar-header">
          <p className="desarrollo-desc">Proyectos efectivos</p>
          <div className="desarrollo-search">
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="desarrollo-tabs">
            <button
              type="button"
              className={activeTab === 'proceso' ? 'active' : ''}
              onClick={() => setActiveTab('proceso')}
            >
              Proceso ({enProceso.length})
            </button>
            <button
              type="button"
              className={activeTab === 'desarrollados' ? 'active' : ''}
              onClick={() => setActiveTab('desarrollados')}
            >
              Desarrollados ({desarrollados.length})
            </button>
          </div>
        </div>

        <div className="desarrollo-sidebar-content">
          {loading ? (
            <p className="desarrollo-loading">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="desarrollo-empty">No hay proyectos</p>
          ) : (
            <div className="desarrollo-sidebar-list">
              {filtered.map((p) => {
                const isSelected = expandedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`desarrollo-sidebar-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setExpandedId(p.id)}
                  >
                    <span className="desarrollo-consecutivo">{p.consecutive || 'S/C'}</span>
                    <span className="desarrollo-sidebar-client">
                      {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
                    </span>
                    <span className="desarrollo-sidebar-badges">
                      {(() => {
                        const pending = countPendingInProject('desarrollo', p, user?.id);
                        return pending > 0 ? (
                          <span className="desarrollo-pending-badge" title={`${pending} pendiente(s)`}>
                            {pending > 99 ? '99+' : pending}
                          </span>
                        ) : null;
                      })()}
                      {(() => {
                        const pr = projectProgressLabel('desarrollo', p);
                        return pr ? <span className="desarrollo-sidebar-progress">{pr}</span> : null;
                      })()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="desarrollo-main">
        {selectedProject ? (
          <div className="desarrollo-detail-view">
            <div className="desarrollo-detail-header">
              <button
                type="button"
                className="desarrollo-back-btn"
                onClick={() => setExpandedId(null)}
              >
                ← Volver
              </button>
              <div className="desarrollo-header-info">
                <h2>{selectedProject.consecutive} — {selectedProject.name}</h2>
                <div className="desarrollo-meta">
                  <p><strong>Cliente:</strong> {selectedProject.client}</p>
                </div>
                <div className="desarrollo-badges">
                  <span className="badge badge-version">v{selectedProject.version ?? 1}</span>
                  <span className="badge badge-estado">Estado: {selectedProject.state ?? 0}%</span>
                </div>
              </div>
            </div>

            <ProjectProductsTable
              variants={selectedProject.variants || []}
              projectId={selectedProject.id}
              isVariantEditable={(v) => String(v.assignedDevelopmentUserId || '') === String(user?.id || '')}
              onMarkAsDeveloped={activeTab === 'proceso' && user?.id ? async (projectId, variantId, variantQuoteId) => {
                try {
                  await catalog.markVariantAsDeveloped(projectId, variantId, user.id, variantQuoteId);
                  load(true);
                } catch (err) {
                  notifications.show({
                    title: 'Error',
                    message: err?.message || 'Error al marcar desarrollado',
                    color: 'red',
                  });
                }
              } : undefined}
              onRefresh={() => load(true)}
            />
          </div>
        ) : (
          <div className="desarrollo-no-selection">
            <span className="selection-icon">⚙️</span>
            <p>Selecciona un proyecto para gestionar el desarrollo</p>
          </div>
        )}
      </div>
    </div>
  );
}
