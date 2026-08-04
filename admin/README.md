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

## Rodar

```bash
cd admin
npm install
npm run dev
```

Abre em http://localhost:5174

## Template de excursão

Ao cadastrar em **Excursões / Pacotes**, a página pública fica em:

`/pages/excursao.html?slug=SEU-SLUG`

Marque **Destaque na Home** para aparecer na Seção 6 (Pacotes Turísticos).
