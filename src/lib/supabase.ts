import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).__APP_CONFIG__?.SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl ? new URL(rawSupabaseUrl).origin : '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).__APP_CONFIG__?.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not set. Auth might not work correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
