import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Note: createClient is generic over the Database type, so all queries through
// `supabase` are fully typed end-to-end from schema.sql.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[okto] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in.',
  );
}

export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);
