import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// In development, route through Vite's local /supabase proxy to prevent browser adblockers (Brave Shields, uBlock) from blocking *.supabase.co
const supabaseUrl =
  import.meta.env.DEV && typeof window !== 'undefined'
    ? `${window.location.origin}/supabase`
    : rawUrl;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    'PrepAI Notice: VITE_SUPABASE_URL is not configured in .env. Supabase Auth and remote calls will operate in placeholder mode.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
