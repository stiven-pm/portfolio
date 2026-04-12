/**
 * Solo http(s) permitido para abrir en nueva pestaña (evita javascript:, data:, etc.).
 */
export function isSafeHttpUrl(url) {
  if (url == null || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t, window.location.origin);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
