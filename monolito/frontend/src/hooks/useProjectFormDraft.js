import { useCallback, useEffect, useState } from 'react';
import { useFormDraftStorage } from '../context/FormDraftStorageContext';

const DRAFT_VERSION = 1;

/**
 * Borrador «Crear proyecto» (localStorage vía FormDraftStorageContext).
 */
export function useProjectFormDraft() {
  const { userId, readJson, writeJson, remove, keys } = useFormDraftStorage();
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    if (!userId) {
      setHydrated(true);
      return;
    }
    try {
      const p = readJson(keys.PROJECT_FORM);
      if (p?.v === DRAFT_VERSION) {
        setName(p.name ?? '');
        setClient(p.client ?? '');
        setRegion(p.region ?? '');
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [userId, readJson, keys.PROJECT_FORM]);

  const persist = useCallback(() => {
    if (!userId || !hydrated) return;
    try {
      writeJson(keys.PROJECT_FORM, { v: DRAFT_VERSION, name, client, region });
    } catch {
      /* ignore */
    }
  }, [userId, hydrated, name, client, region, writeJson, keys.PROJECT_FORM]);

  useEffect(() => {
    persist();
  }, [persist]);

  const clear = useCallback(() => {
    if (userId) {
      try {
        remove(keys.PROJECT_FORM);
      } catch {
        /* ignore */
      }
    }
    setName('');
    setClient('');
    setRegion('');
  }, [userId, remove, keys.PROJECT_FORM]);

  return {
    hydrated,
    name,
    setName,
    client,
    setClient,
    region,
    setRegion,
    clear,
  };
}
