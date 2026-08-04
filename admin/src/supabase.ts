import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. Crie o arquivo admin/.env (veja .env.example).'
  );
}

export const supabase = createClient(url, anonKey);
export const BUCKET = 'excursoes';
