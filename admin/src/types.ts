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
