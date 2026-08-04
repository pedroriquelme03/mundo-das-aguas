# Painel Administrativo — Mundo das Águas

Painel em **Vite + TypeScript** para gerenciar as **Excursões de Compras** exibidas na Home
(Seção 4). Os dados ficam no **Supabase** (banco + Storage + Auth).

## Pré-requisitos
- Node.js 18+
- Projeto Supabase já criado (projeto `mundo-das-aguas`, ref `ayzrwkjijauyflsrmkoq`).

## Configuração
As credenciais já vêm preenchidas em `.env` (chave **publicável** — segura para o front,
pois o acesso é controlado por RLS). Para outro ambiente, copie `.env.example` para `.env`.

## Rodar em desenvolvimento
```bash
cd admin
npm install
npm run dev
```
Abre em http://localhost:5174

## Build de produção
```bash
npm run build      # gera admin/dist
npm run preview    # testa o build localmente
```
Publique o conteúdo de `admin/dist` em qualquer host estático (ou em uma subpasta `/admin` do site).

## Criar o usuário administrador (login)
Por segurança, o usuário/senha do admin **não é criado automaticamente**. Crie uma vez:

1. Acesse o painel do Supabase → projeto **mundo-das-aguas** → **Authentication → Users → Add user**.
2. Informe **e-mail** e **senha** e confirme (marque "Auto Confirm User").
3. Use esse e-mail/senha na tela de login do painel.

> Dica: em **Authentication → Providers → Email**, mantenha "Confirm email" conforme sua preferência.
> Para um único administrador, você pode desativar novos cadastros públicos (deixe apenas o usuário criado acima).

## O que dá para gerenciar
Cada excursão de compras tem: destino, cidade/estado, cidade de embarque, data de saída,
data de retorno, faixa de destaque (opcional), foto, link do botão, ordem e ativo/inativo.

As excursões marcadas como **ativo** aparecem automaticamente na Home, ordenadas por **ordem**
e depois por **data de saída**. As fotos são enviadas para o bucket `excursoes` (leitura pública).

## Como a Home consome os dados
A Home (`../index.html`) carrega `../js/excursoes-compras.js`, que busca a tabela
`excursoes_compras` via chave publicável (somente leitura pela política RLS) e renderiza os cards.
