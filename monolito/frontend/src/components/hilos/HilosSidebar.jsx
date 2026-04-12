import { TextInput } from '@mantine/core';
import { countPendingInProject, projectProgressLabel } from '../../utils/projectWorkflowProgress';

export default function HilosSidebar({
  searchText,
  onSearchChange,
  displayProjects,
  threads,
  selectedId,
  onSelectProject,
  workflowRole = null,
  workflowUserId = null,
}) {
  return (
    <aside className="hilos-sidebar">
      <div className="hilos-sidebar-header">
        <h2>Hilos</h2>
        <TextInput
          placeholder="Buscar proyecto..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          size="sm"
          classNames={{ input: 'hilos-search-input' }}
        />
      </div>

      {displayProjects.length === 0 ? (
        <p className="hilos-empty">{searchText.trim() ? 'Sin resultados' : 'No hay proyectos'}</p>
      ) : (
        <ul className="hilos-sidebar-list">
          {displayProjects.map((p) => {
            const open = (threads[p.id] || []).filter((t) => !t.closedAt).length;
            const pr = workflowRole ? projectProgressLabel(workflowRole, p) : null;
            const pending =
              workflowRole ? countPendingInProject(workflowRole, p, workflowUserId) : 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`hilos-sidebar-item${selectedId === p.id ? ' active' : ''}`}
                  onClick={() => onSelectProject(p.id)}
                >
                  <span className="hilos-sidebar-consec">{p.consecutive || p.name}</span>
                  <span className="hilos-sidebar-client">
                    {(p.client || 'Sin cliente')} — {p.name || 'Sin nombre'}
                  </span>
                  {pr ? <span className="hilos-workflow-progress">{pr}</span> : null}
                  {pending > 0 && (
                    <span
                      className={`hilos-workflow-pending-dot${open > 0 ? ' hilos-workflow-pending-dot--offset' : ''}`}
                      title={`${pending} pendiente(s)`}
                    >
                      {pending > 99 ? '99+' : pending}
                    </span>
                  )}
                  {open > 0 && <span className="hilos-sidebar-dot">{open}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
