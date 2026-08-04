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

function one(tipo, slug, row, ordem) {
  return `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values
('${tipo}', ${u(b64(row.titulo))}, '${slug}', ${u(b64(row.atualizacao))}, ${u(b64(row.conteudo))}, true, ${ordem})
on conflict (slug) do update set titulo=excluded.titulo, atualizacao=excluded.atualizacao, conteudo=excluded.conteudo, updated_at=now();`;
}

const priv = extract('pages/politica-privacidade.html');
const termos = extract('pages/termos-uso.html');
writeFileSync('tmp-seed-priv-b64.sql', one('privacidade', 'politica-privacidade', priv, 1));
writeFileSync('tmp-seed-termos-b64.sql', one('termos', 'termos-uso', termos, 2));
console.log('priv', readFileSync('tmp-seed-priv-b64.sql').length);
console.log('termos', readFileSync('tmp-seed-termos-b64.sql').length);
