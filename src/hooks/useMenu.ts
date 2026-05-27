'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMenu, getSettings, type MenuSection } from '@/lib/supabase/queries';
import type { SettingsRow } from '@/lib/supabase/types';

export type UseMenuResult = {
  menu: MenuSection[] | null;
  settings: SettingsRow | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

export function useMenu(): UseMenuResult {
  const [menu, setMenu] = useState<MenuSection[] | null>(null);
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([getSettings(), getMenu()]);
      setSettings(s);
      setMenu(m);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { menu, settings, loading, error, reload: load };
}
