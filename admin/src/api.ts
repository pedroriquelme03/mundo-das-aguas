import { supabase, BUCKET } from './supabase';
import type {
  ExcursaoCompras, ExcursaoComprasInput,
  Excursao, ExcursaoInput,
  FrotaVeiculo, FrotaInput,
  Depoimento, DepoimentoInput,
  BlogPost, BlogPostInput,
  ContatoLead,
  SiteSettings, SiteSettingsInput,
  PaginaLegal, PaginaLegalInput,
  SiteContact, SiteContactInput,
  SiteMedia,
  BioLink, BioLinkInput
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
  // Caminhos locais do site (fallback até migrar para Storage)
  if (path.startsWith('/')) return path;
  if (path.startsWith('img/') || path.startsWith('images/')) return '/' + path;
  if (path.startsWith('../img/')) return path.replace(/^\.\./, '');
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const MEDIA_FOLDERS = [
  { id: 'compras', label: 'Compras (Home)' },
  { id: 'excursoes', label: 'Excursões / Pacotes' },
  { id: 'frota', label: 'Frota' },
  { id: 'blog', label: 'Blog' },
  { id: 'paginas', label: 'Páginas / Banners' },
  { id: 'settings', label: 'General Settings' },
  { id: 'outros', label: 'Outros' }
] as const;

export type MediaFolderId = (typeof MEDIA_FOLDERS)[number]['id'];

export interface StorageImage {
  path: string;
  name: string;
  folder: MediaFolderId;
  size: number | null;
  updatedAt: string | null;
  url: string;
}

export type MediaLibrary = Record<MediaFolderId, StorageImage[]>;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

function isStorageFolder(item: { id: string | null }): boolean {
  return item.id === null;
}

function toStorageImage(
  folder: MediaFolderId,
  name: string,
  item: { metadata?: { size?: number } | null; updated_at?: string | null }
): StorageImage {
  const path = folder === 'outros' ? name : `${folder}/${name}`;
  return {
    path,
    name,
    folder,
    size: item.metadata?.size ?? null,
    updatedAt: item.updated_at ?? null,
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  };
}

/** Lista imagens do bucket, agrupadas pela pasta de upload (categoria de cadastro). */
export async function listStorageImages(): Promise<MediaLibrary> {
  const library: MediaLibrary = {
    compras: [],
    excursoes: [],
    frota: [],
    blog: [],
    paginas: [],
    settings: [],
    outros: []
  };

  const known = new Set(['compras', 'excursoes', 'frota', 'blog', 'paginas', 'settings']);

  const { data: root, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' }
  });
  if (error) throw error;

  const extraFolders: string[] = [];

  for (const item of root ?? []) {
    if (isStorageFolder(item)) {
      if (!known.has(item.name)) extraFolders.push(item.name);
      continue;
    }
    if (IMAGE_EXT.test(item.name)) {
      library.outros.push(toStorageImage('outros', item.name, item));
    }
  }

  for (const folder of ['compras', 'excursoes', 'frota', 'blog', 'paginas', 'settings'] as const) {
    const { data, error: err } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (err) throw err;
    for (const item of data ?? []) {
      if (isStorageFolder(item) || !IMAGE_EXT.test(item.name)) continue;
      library[folder].push(toStorageImage(folder, item.name, item));
    }
  }

  for (const folder of extraFolders) {
    const { data, error: err } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    });
    if (err) continue;
    for (const item of data ?? []) {
      if (isStorageFolder(item) || !IMAGE_EXT.test(item.name)) continue;
      const path = `${folder}/${item.name}`;
      library.outros.push({
        path,
        name: `${folder}/${item.name}`,
        folder: 'outros',
        size: item.metadata?.size ?? null,
        updatedAt: item.updated_at ?? null,
        url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      });
    }
  }

  return library;
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

/* ---------- Usuários do painel (Edge Function) ---------- */
export type AdminUserRow = {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'leitor';
  created_at?: string;
  last_sign_in_at?: string | null;
};

async function callAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error(String((data as { error: string }).error));
  }
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const j = await ctx.clone().json() as { error?: string };
        if (j?.error) throw new Error(j.error);
      } catch (e) {
        if (e instanceof Error && e.message && e.message !== error.message) throw e;
      }
    }
    throw new Error(error.message);
  }
  return data as T;
}

export const listAdminUsers = () =>
  callAdminUsers<{ users: AdminUserRow[] }>({ action: 'list' }).then((d) => d.users);

export const createAdminUser = (input: { email: string; password: string; role: string }) =>
  callAdminUsers<{ user: AdminUserRow }>({ action: 'create', ...input });

export const updateAdminUser = (input: {
  id: string;
  email?: string;
  password?: string;
  role?: string;
}) => callAdminUsers<{ user: AdminUserRow }>({ action: 'update', ...input });

export const deleteAdminUser = (id: string) =>
  callAdminUsers<{ ok: boolean }>({ action: 'delete', id });

/* ---------- General Settings ---------- */
export const DEFAULT_SITE_SETTINGS: SiteSettingsInput = {
  site_title: 'Mundo das Águas Turismo',
  tagline: 'Fretamento, excursões e turismo rodoviário',
  site_icon_path: null,
  site_language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  date_format: 'd/m/Y',
  time_format: 'H:i',
  week_starts_on: 0,
  login_url: '/admin/'
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'general')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { id: 'general', ...DEFAULT_SITE_SETTINGS };
  }
  return data as SiteSettings;
}

export async function saveSiteSettings(input: SiteSettingsInput): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({
      id: 'general',
      ...input,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

/* ---------- Páginas legais ---------- */
export const listPaginasLegais = () =>
  listAll<PaginaLegal>('paginas_legais', [{ col: 'ordem' }, { col: 'titulo' }]);

export const createPaginaLegal = (input: PaginaLegalInput) => insertRow('paginas_legais', input);
export const updatePaginaLegal = (id: string, input: Partial<PaginaLegalInput>) =>
  updateRow('paginas_legais', id, input);
export const deletePaginaLegal = (id: string) => deleteRow('paginas_legais', id);

/* ---------- Contato do site ---------- */
export const DEFAULT_SITE_CONTACT: SiteContactInput = {
  empresa: 'Mundo das Águas Turismo',
  email: 'atendimento@mundodasaguas.com.br',
  telefone_agencia: '(45) 3523-3060',
  whatsapp_comercial: '5545999677835',
  whatsapp_comercial_label: '(45) 99967-7835',
  whatsapp_emergencial: '5545999648080',
  whatsapp_emergencial_label: '(45) 99964-8080',
  endereco_linha1: 'Av. Safira, 1375 — Parque Patriarca',
  endereco_linha2: '',
  cidade: 'Foz do Iguaçu',
  estado: 'PR',
  cep: '85854-000',
  mapa_url: 'https://share.google/9oMqpcefoCuCh2cz4',
  horario_atendimento: 'Segunda a Sexta, das 08h às 18h | Sábado, das 08h às 12h',
  mensagem_wa_comercial: 'Olá! Gostaria de informações.',
  mensagem_wa_emergencial: 'Olá! Preciso de suporte durante a viagem.',
  instagram_url: '',
  facebook_url: '',
  youtube_url: '',
  bio_url: '/bio'
};

export async function getSiteContact(): Promise<SiteContact> {
  const { data, error } = await supabase
    .from('site_contact')
    .select('*')
    .eq('id', 'general')
    .maybeSingle();
  if (error) throw error;
  if (!data) return { id: 'general', ...DEFAULT_SITE_CONTACT };
  return data as SiteContact;
}

export async function saveSiteContact(input: SiteContactInput): Promise<void> {
  const { error } = await supabase
    .from('site_contact')
    .upsert({
      id: 'general',
      ...input,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
}

/* ---------- Mídias institucionais ---------- */
export async function listSiteMedia(): Promise<SiteMedia[]> {
  const { data, error } = await supabase
    .from('site_media')
    .select('*')
    .order('grupo', { ascending: true })
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as SiteMedia[];
}

export async function updateSiteMedia(
  chave: string,
  input: Partial<Pick<SiteMedia, 'image_path' | 'alt_text' | 'caption' | 'titulo' | 'ordem'>>
): Promise<void> {
  const { error } = await supabase
    .from('site_media')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('chave', chave);
  if (error) throw error;
}

/* ---------- Bio / Links ---------- */
export const listBioLinks = () =>
  listAll<BioLink>('bio_links', [{ col: 'ordem' }, { col: 'titulo' }]);
export const createBioLink = (input: BioLinkInput) => insertRow('bio_links', input);
export const updateBioLink = (id: string, input: Partial<BioLinkInput>) =>
  updateRow('bio_links', id, input);
export const deleteBioLink = (id: string) => deleteRow('bio_links', id);

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
