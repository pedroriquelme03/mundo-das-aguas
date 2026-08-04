import { supabase, BUCKET } from './supabase';
import type { ExcursaoCompras, ExcursaoInput } from './types';

const TABLE = 'excursoes_compras';

export async function listExcursoes(): Promise<ExcursaoCompras[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('ordem', { ascending: true })
    .order('data_saida', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ExcursaoCompras[];
}

export async function createExcursao(input: ExcursaoInput): Promise<void> {
  const { error } = await supabase.from(TABLE).insert(input);
  if (error) throw error;
}

export async function updateExcursao(id: string, input: Partial<ExcursaoInput>): Promise<void> {
  const { error } = await supabase.from(TABLE).update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteExcursao(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/** Faz upload da foto para o bucket e devolve o caminho salvo (foto_path). */
export async function uploadFoto(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safe = file.name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .slice(0, 40);
  const path = `${Date.now()}-${safe || 'foto'}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined
  });
  if (error) throw error;
  return path;
}

export async function removeFoto(path: string | null | undefined): Promise<void> {
  if (!path || /^https?:\/\//i.test(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export function fotoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
