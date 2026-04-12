export const solicitudesInitialState = {
  projects: [],
  loading: true,
  activeTab: 'proceso',
  searchText: '',
  expandedId: null,
  pdfModal: { visible: false, project: null, products: [] },
  modificaciones: {},
};

export function solicitudesReducer(state, action) {
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
    case 'SET_PDF_MODAL':
      return { ...state, pdfModal: action.payload };
    case 'SET_MODIFICACIONES':
      return { ...state, modificaciones: action.payload };
    case 'UPDATE_MODIFICACION':
      return { ...state, modificaciones: action.payload };
    case 'REMOVE_MODIFICACION':
      return { ...state, modificaciones: action.payload };
    default:
      return state;
  }
}

/** Lista visible según pestaña y búsqueda (misma regla que el sidebar). */
export function filterSolicitudesList(projects, activeTab, searchText) {
  const base =
    activeTab === 'proceso'
      ? projects.filter((p) => !p.quoted || p.reopen)
      : projects.filter((p) => p.quoted && !p.reopen);
  const q = searchText.trim().toLowerCase();
  if (!q) return base;
  return base.filter((p) => (p.consecutive || p.name || '').toLowerCase().includes(q));
}
