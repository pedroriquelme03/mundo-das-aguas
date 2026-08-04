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

function sql(tipo, slug, row, ordem) {
  return `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem)
values (
  '${tipo}',
  $t$${row.titulo}$t$,
  '${slug}',
  $a$${row.atualizacao}$a$,
  $c$${row.conteudo}$c$,
  true,
  ${ordem}
)
on conflict (slug) do update set
  titulo = excluded.titulo,
  atualizacao = excluded.atualizacao,
  conteudo = excluded.conteudo,
  updated_at = now();`;
}

const priv = extract('pages/politica-privacidade.html');
const termos = extract('pages/termos-uso.html');
writeFileSync('tmp-seed-priv.sql', sql('privacidade', 'politica-privacidade', priv, 1));
writeFileSync('tmp-seed-termos.sql', sql('termos', 'termos-uso', termos, 2));
console.log('priv', readFileSync('tmp-seed-priv.sql').length);
console.log('termos', readFileSync('tmp-seed-termos.sql').length);
