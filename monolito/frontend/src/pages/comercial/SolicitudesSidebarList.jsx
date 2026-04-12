export default function SolicitudesSidebarList({
  list,
  searchText,
  activeTab,
  selectedId,
  setSelectedId,
}) {
  if (list.length === 0) {
    return (
      <p className="solicitudes-empty">
        {searchText.trim()
          ? 'No se encontraron solicitudes'
          : activeTab === 'proceso'
            ? 'No tienes solicitudes en proceso'
            : 'No tienes solicitudes cotizadas'}
      </p>
    );
  }
  return (
    <div className="solicitudes-sidebar-list">
      {list.map((p) => {
        const isSelected = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={`solicitudes-sidebar-item ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="solicitudes-consecutivo">{p.consecutive || 'S/C'}</span>
            <span className="solicitudes-sidebar-client">
              {(p.client || 'Sin cliente')} — {(p.name || 'Sin nombre')}
              {activeTab === 'cotizadas' && p.effective && (
                <span className="solicitudes-effective-tag"> (Efectivo)</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
