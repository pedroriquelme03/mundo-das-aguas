# Painel Administrativo — Mundo das Águas

Painel em **Vite + TypeScript** para gerenciar o conteúdo do site.
Projeto Supabase: **Site Mundo das Aguas** (`yzfvqsftphsoylzpfrug`).

## Módulos

| Aba | Tabela | Uso |
|-----|--------|-----|
| Compras (Home) | `excursoes_compras` | Cards da Seção 4 da Home |
| Excursões / Pacotes | `excursoes` | Página `pages/excursao.html?slug=...` + Pacotes na Home (`destaque_home`) |
| Frota | `frota` | Página `pages/frota.html` (catálogo dinâmico) |
| Depoimentos | `depoimentos` | Seção 8 da Home |
| Blog | `blog_posts` | `pages/blog.html` e `pages/blog-artigo.html` |
| Leads | `contato_leads` | Formulários de Contato |

## Deploy (Vercel)

O site estático e o painel ficam no mesmo projeto. O `vercel.json` na raiz:

1. Roda `npm run build` dentro de `admin/`
2. Copia o `dist` para `/admin/` (substitui o HTML fonte só no build)

Variáveis obrigatórias no Vercel (**disponíveis no Build**):

```
VITE_SUPABASE_URL=https://yzfvqsftphsoylzpfrug.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Depois de alterar variáveis, faça um **Redeploy**.

URL do painel: `https://seu-dominio.vercel.app/admin/`

## Template de excursão

Ao cadastrar em **Excursões / Pacotes**, a página pública fica em:

`/pages/excursao.html?slug=SEU-SLUG`

Marque **Destaque na Home** para aparecer na Seção 6 (Pacotes Turísticos).
