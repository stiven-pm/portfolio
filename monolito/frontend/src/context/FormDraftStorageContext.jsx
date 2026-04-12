import { createContext, useCallback, useContext, useMemo } from 'react';
import { useUser } from './UserContext';

const FormDraftStorageContext = createContext(null);

/** Claves bajo prefijo app:draft:{key}:{userId} (persistencia tipo AsyncStorage en web). */
export const FORM_DRAFT_KEYS = {
  PRODUCT_CREATE: 'crear-producto',
  PROJECT_FORM: 'proyecto-form',
};

/**
 * Acceso unificado a borradores en localStorage por usuario.
 */
export function FormDraftStorageProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const prefix = useCallback(
    (key) => (userId ? `app:draft:${key}:${userId}` : null),
    [userId]
  );

  const readJson = useCallback(
    (key, fallback = null) => {
      const p = prefix(key);
      if (!p) return fallback;
      try {
        const raw = localStorage.getItem(p);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    [prefix]
  );

  const writeJson = useCallback(
    (key, value) => {
      const p = prefix(key);
      if (!p) return;
      try {
        localStorage.setItem(p, JSON.stringify(value));
      } catch {
        /* quota */
      }
    },
    [prefix]
  );

  const remove = useCallback(
    (key) => {
      const p = prefix(key);
      if (!p) return;
      try {
        localStorage.removeItem(p);
      } catch {
        /* ignore */
      }
    },
    [prefix]
  );

  const api = useMemo(
    () => ({
      userId,
      readJson,
      writeJson,
      remove,
      keys: FORM_DRAFT_KEYS,
    }),
    [userId, readJson, writeJson, remove]
  );

  return <FormDraftStorageContext.Provider value={api}>{children}</FormDraftStorageContext.Provider>;
}

export function useFormDraftStorage() {
  const ctx = useContext(FormDraftStorageContext);
  if (!ctx) {
    throw new Error('useFormDraftStorage debe usarse dentro de FormDraftStorageProvider');
  }
  return ctx;
}
