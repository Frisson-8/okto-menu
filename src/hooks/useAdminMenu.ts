'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMenuForAdmin, type MenuSection } from '@/lib/supabase/queries';

export type UseAdminMenuResult = {
  sections: MenuSection[] | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useAdminMenu(): UseAdminMenuResult {
  const [sections, setSections] = useState<MenuSection[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMenuForAdmin();
      setSections(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { sections, loading, error, reload: load };
}
