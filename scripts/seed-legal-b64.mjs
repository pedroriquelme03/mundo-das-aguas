import { readFileSync, writeFileSync } from 'node:fs';

function extract(file) {
  const html = readFileSync(file, 'utf8');
  const main = html.match(/<main class="page-content">([\s\S]*?)<\/main>/)[1];
  const titulo = (main.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1].trim();
  const atualizacao = (main.match(/<p class="subtitle">([\s\S]*?)<\/p>/) || [])[1]
    .replace(/^Última atualização:\s*/i, '')
    .trim();
  const conteudo = main
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="subtitle">[\s\S]*?<\/p>/, '')
    .trim();
  return { titulo, atualizacao, conteudo };
}

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const u = (b) => `convert_from(decode('${b}', 'base64'), 'UTF8')`;

const priv = extract('pages/politica-privacidade.html');
const termos = extract('pages/termos-uso.html');

const sql = `
insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values
('privacidade', ${u(b64(priv.titulo))}, 'politica-privacidade', ${u(b64(priv.atualizacao))}, ${u(b64(priv.conteudo))}, true, 1),
('termos', ${u(b64(termos.titulo))}, 'termos-uso', ${u(b64(termos.atualizacao))}, ${u(b64(termos.conteudo))}, true, 2)
on conflict (slug) do update set
  titulo = excluded.titulo,
  atualizacao = excluded.atualizacao,
  conteudo = excluded.conteudo,
  updated_at = now();
`;

writeFileSync('tmp-seed-legal-b64.sql', sql, 'utf8');
console.log('len', sql.length);
