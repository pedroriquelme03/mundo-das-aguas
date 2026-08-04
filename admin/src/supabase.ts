import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigError =
  !url || !anonKey
    ? 'Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no build. Configure-as no Vercel e faça um novo deploy.'
    : '';

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder'
);

export const BUCKET = 'excursoes';
