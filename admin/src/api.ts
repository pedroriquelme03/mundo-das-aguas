import { supabase, BUCKET } from './supabase';
import type {
  ExcursaoCompras, ExcursaoComprasInput,
  Excursao, ExcursaoInput,
  FrotaVeiculo, FrotaInput,
  Depoimento, DepoimentoInput,
  BlogPost, BlogPostInput,
  ContatoLead
} from './types';

/* ---------- Storage ---------- */
export async function uploadFoto(file: File, folder = ''): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safe = file.name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .slice(0, 40);
  const prefix = folder ? `${folder}/` : '';
  const path = `${prefix}${Date.now()}-${safe || 'foto'}.${ext}`;
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
  // Caminhos locais do site (ex.: img/onibus/...)
  if (path.startsWith('img/') || path.startsWith('../img/') || path.startsWith('/img/')) {
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/* ---------- Generic CRUD ---------- */
async function listAll<T>(table: string, orderCols: { col: string; asc?: boolean }[]): Promise<T[]> {
  let q = supabase.from(table).select('*');
  for (const o of orderCols) q = q.order(o.col, { ascending: o.asc !== false });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

async function insertRow(table: string, input: object): Promise<void> {
  const { error } = await supabase.from(table).insert(input);
  if (error) throw error;
}

async function updateRow(table: string, id: string, input: object): Promise<void> {
  const { error } = await supabase.from(table).update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/* ---------- Excursões de Compras ---------- */
export const listExcursoes = () => listAll<ExcursaoCompras>('excursoes_compras', [{ col: 'ordem' }, { col: 'data_saida' }]);
export const createExcursao = (input: ExcursaoComprasInput) => insertRow('excursoes_compras', input);
export const updateExcursao = (id: string, input: Partial<ExcursaoComprasInput>) => updateRow('excursoes_compras', id, input);
export const deleteExcursao = (id: string) => deleteRow('excursoes_compras', id);

/* ---------- Excursões / Pacotes (template) ---------- */
export const listExcursoesFull = () => listAll<Excursao>('excursoes', [{ col: 'ordem' }, { col: 'data_saida' }]);
export const createExcursaoFull = (input: ExcursaoInput) => insertRow('excursoes', input);
export const updateExcursaoFull = (id: string, input: Partial<ExcursaoInput>) => updateRow('excursoes', id, input);
export const deleteExcursaoFull = (id: string) => deleteRow('excursoes', id);

/* ---------- Frota ---------- */
export const listFrota = () => listAll<FrotaVeiculo>('frota', [{ col: 'ordem' }]);
export const createFrota = (input: FrotaInput) => insertRow('frota', input);
export const updateFrota = (id: string, input: Partial<FrotaInput>) => updateRow('frota', id, input);
export const deleteFrota = (id: string) => deleteRow('frota', id);

/* ---------- Depoimentos ---------- */
export const listDepoimentos = () => listAll<Depoimento>('depoimentos', [{ col: 'ordem' }]);
export const createDepoimento = (input: DepoimentoInput) => insertRow('depoimentos', input);
export const updateDepoimento = (id: string, input: Partial<DepoimentoInput>) => updateRow('depoimentos', id, input);
export const deleteDepoimento = (id: string) => deleteRow('depoimentos', id);

/* ---------- Blog ---------- */
export const listBlog = () => listAll<BlogPost>('blog_posts', [{ col: 'ordem' }, { col: 'data_publicacao', asc: false }]);
export const createBlog = (input: BlogPostInput) => insertRow('blog_posts', input);
export const updateBlog = (id: string, input: Partial<BlogPostInput>) => updateRow('blog_posts', id, input);
export const deleteBlog = (id: string) => deleteRow('blog_posts', id);

/* ---------- Contato / Leads ---------- */
export const listLeads = () => listAll<ContatoLead>('contato_leads', [{ col: 'created_at', asc: false }]);
export const deleteLead = (id: string) => deleteRow('contato_leads', id);

export function curriculoSignedUrl(path: string): Promise<string | null> {
  return supabase.storage.from('curriculos').createSignedUrl(path, 3600).then(({ data, error }) => {
    if (error) return null;
    return data?.signedUrl ?? null;
  });
}

/* ---------- Helpers ---------- */
export function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function linesToArray(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function arrayToLines(arr: string[] | null | undefined): string {
  return (arr || []).join('\n');
}
