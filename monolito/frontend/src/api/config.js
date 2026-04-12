const API_BASE = import.meta.env.VITE_API_BASE || '';

export const ENDPOINTS = {
  graphql: `${API_BASE}/api/graphql`,
  document: `${API_BASE}/api/document`,
};
