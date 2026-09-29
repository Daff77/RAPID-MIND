import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof globalThis !== 'undefined' && (globalThis as any).process ? (globalThis as any).process.env : {});
const rawUrl = (env.VITE_SUPABASE_URL || '').trim();
// Sanitize URL: remove trailing /rest/v1 and trailing slashes so supabase-js SDK works properly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Returns true if valid Supabase environment variables are provided.
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseUrl.startsWith('https://')
  );
}

/**
 * Supabase client instance.
 * Gracefully creates dummy/null-safe client if not configured so the app never crashes.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
