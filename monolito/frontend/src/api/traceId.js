/** Obtiene o genera trace ID para correlacionar logs en toda la operación. */
export function getTraceId() {
  if (typeof window !== 'undefined' && window.__appTraceId) return window.__appTraceId;
  const id = crypto.randomUUID?.() || `t-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  if (typeof window !== 'undefined') window.__appTraceId = id;
  return id;
}

/** Reinicia el trace ID (nueva operación). */
export function resetTraceId() {
  if (typeof window !== 'undefined') window.__appTraceId = null;
}

export const TRACE_ID_HEADER = 'X-Trace-Id';
