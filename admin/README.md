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

O `vercel.json` na **raiz do repositório** monta a pasta `public/` com:

1. Site estático (HTML/CSS/JS)
2. Painel Vite buildado em `/admin/`

**Importante no painel do Vercel → Settings → General:**

- **Root Directory:** vazio (raiz do repo) — **não** use `admin`
- **Framework Preset:** Other
- **Output Directory:** `public` (ou deixe o `vercel.json` mandar)

Variáveis (Production + Build):

```
VITE_SUPABASE_URL=https://yzfvqsftphsoylzpfrug.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

URL do painel: `https://seu-dominio.vercel.app/admin/`

## Template de excursão

Ao cadastrar em **Excursões / Pacotes**, a página pública fica em:

`/pages/excursao.html?slug=SEU-SLUG`

Marque **Destaque na Home** para aparecer na Seção 6 (Pacotes Turísticos).
