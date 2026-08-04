export interface ExcursaoCompras {
  id: string;
  destino: string;
  cidade_estado: string | null;
  cidade_embarque: string | null;
  data_saida: string | null;   // YYYY-MM-DD
  data_retorno: string | null; // YYYY-MM-DD
  faixa_destaque: string | null;
  foto_path: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Campos editáveis no formulário (sem id/timestamps). */
export type ExcursaoInput = Omit<ExcursaoCompras, 'id' | 'created_at' | 'updated_at'>;
