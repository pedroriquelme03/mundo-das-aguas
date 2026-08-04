/* ---------- Excursões de Compras (Home — cards simples) ---------- */
export interface ExcursaoCompras {
  id: string;
  destino: string;
  cidade_estado: string | null;
  cidade_embarque: string | null;
  data_saida: string | null;
  data_retorno: string | null;
  faixa_destaque: string | null;
  foto_path: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
export type ExcursaoComprasInput = Omit<ExcursaoCompras, 'id' | 'created_at' | 'updated_at'>;

/* ---------- Excursões / Pacotes (template completo) ---------- */
export type ExcursaoCategoria =
  | 'compras'
  | 'romaria'
  | 'pescaria'
  | 'nacional'
  | 'internacional'
  | 'pacote';

export interface Excursao {
  id: string;
  slug: string;
  categoria: ExcursaoCategoria;
  nome: string;
  periodo_texto: string | null;
  cidade_estado: string | null;
  cidade_embarque: string | null;
  data_saida: string | null;
  data_retorno: string | null;
  faixa_destaque: string | null;
  foto_capa_path: string | null;
  galeria: string[];
  resumo: string[];
  sobre: string | null;
  incluso: string[];
  roteiro: { dia: string; titulo: string; descricao: string }[];
  infos_importantes: string[];
  formas_pagamento: string | null;
  link_reserva: string | null;
  ordem: number;
  ativo: boolean;
  destaque_home: boolean;
  created_at?: string;
  updated_at?: string;
}
export type ExcursaoInput = Omit<Excursao, 'id' | 'created_at' | 'updated_at'>;

/* ---------- Frota ---------- */
export type FrotaCategoria = 'leito' | 'semi' | 'executivo';

export interface FrotaFeatures {
  banheiro?: boolean;
  ar?: boolean;
  usb?: boolean;
  midia?: boolean;
  bagageiro?: boolean;
  starlink?: boolean;
}

export interface FrotaVeiculo {
  id: string;
  nome: string;
  modelo: string | null;
  categoria: FrotaCategoria;
  lugares: string | null;
  descricao: string | null;
  features: FrotaFeatures;
  galeria: string[];
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
export type FrotaInput = Omit<FrotaVeiculo, 'id' | 'created_at' | 'updated_at'>;

/* ---------- Depoimentos ---------- */
export interface Depoimento {
  id: string;
  nome: string;
  texto: string;
  contexto: string | null;
  estrelas: number;
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
export type DepoimentoInput = Omit<Depoimento, 'id' | 'created_at' | 'updated_at'>;

/* ---------- Blog ---------- */
export type BlogCategoria =
  | 'fretamento'
  | 'compras'
  | 'romarias'
  | 'pescarias'
  | 'pacotes'
  | 'dicas'
  | 'institucional';

export interface BlogPost {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  categoria: BlogCategoria;
  imagem_path: string | null;
  data_publicacao: string | null;
  tempo_leitura: number | null;
  destaque: boolean;
  mais_lidos: boolean;
  ativo: boolean;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}
export type BlogPostInput = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>;

/* ---------- Contato / Leads ---------- */
export type ContatoTipo = 'fretamento' | 'excursoes' | 'encomendas' | 'trabalhe';

export interface ContatoLead {
  id: string;
  tipo: ContatoTipo;
  nome: string;
  email: string | null;
  telefone: string;
  mensagem: string | null;
  campos: Record<string, string>;
  curriculo_path: string | null;
  user_agent: string | null;
  created_at?: string;
}

/** Alias legado usado pelo CRUD de compras. */
export type ExcursaoInputLegacy = ExcursaoComprasInput;

/* ---------- Páginas legais ---------- */
export type PaginaLegalTipo = 'privacidade' | 'termos';

export interface PaginaLegal {
  id: string;
  tipo: PaginaLegalTipo;
  titulo: string;
  slug: string;
  atualizacao: string | null;
  conteudo: string;
  ativo: boolean;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

export type PaginaLegalInput = Omit<PaginaLegal, 'id' | 'created_at' | 'updated_at'>;

/* ---------- General Settings ---------- */
export interface SiteSettings {
  id: 'general';
  site_title: string;
  tagline: string;
  site_icon_path: string | null;
  site_language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  week_starts_on: number;
  login_url: string;
  updated_at?: string;
}

export type SiteSettingsInput = Omit<SiteSettings, 'id' | 'updated_at'>;

/* ---------- Contato do site ---------- */
export interface SiteContact {
  id: 'general';
  empresa: string;
  email: string;
  telefone_agencia: string;
  whatsapp_comercial: string;
  whatsapp_comercial_label: string;
  whatsapp_emergencial: string;
  whatsapp_emergencial_label: string;
  endereco_linha1: string;
  endereco_linha2: string;
  cidade: string;
  estado: string;
  cep: string;
  mapa_url: string;
  horario_atendimento: string;
  mensagem_wa_comercial: string;
  mensagem_wa_emergencial: string;
  updated_at?: string;
}

export type SiteContactInput = Omit<SiteContact, 'id' | 'updated_at'>;

/* ---------- Bio / Links ---------- */
export type BioLinkEstilo = 'padrao' | 'whatsapp';

export interface BioLink {
  id: string;
  titulo: string;
  url: string;
  estilo: BioLinkEstilo;
  nova_aba: boolean;
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export type BioLinkInput = Omit<BioLink, 'id' | 'created_at' | 'updated_at'>;
