import { readFileSync, writeFileSync } from 'node:fs';

function extract(file) {
  const html = readFileSync(file, 'utf8');
  const mainMatch = html.match(/<main class="page-content">([\s\S]*?)<\/main>/);
  if (!mainMatch) throw new Error('main not found in ' + file);
  const main = mainMatch[1];
  const titulo = (main.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1]?.trim() || '';
  const atualizacao = (main.match(/<p class="subtitle">([\s\S]*?)<\/p>/) || [])[1]
    ?.replace(/^Última atualização:\s*/i, '')
    .trim() || '';
  const conteudo = main
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="subtitle">[\s\S]*?<\/p>/, '')
    .trim();
  return { titulo, atualizacao, conteudo };
}

const priv = extract('pages/politica-privacidade.html');
const termos = extract('pages/termos-uso.html');
const q = (s) => s.replace(/'/g, "''");

const sql = `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values
('privacidade', '${q(priv.titulo)}', 'politica-privacidade', '${q(priv.atualizacao)}', '${q(priv.conteudo)}', true, 1),
('termos', '${q(termos.titulo)}', 'termos-uso', '${q(termos.atualizacao)}', '${q(termos.conteudo)}', true, 2)
on conflict (slug) do update set
  titulo = excluded.titulo,
  atualizacao = excluded.atualizacao,
  conteudo = excluded.conteudo,
  updated_at = now();`;

writeFileSync('tmp-seed-legal.sql', sql);
console.log('ok', sql.length, 'chars');
