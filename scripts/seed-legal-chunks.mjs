import { readFileSync, writeFileSync } from 'node:fs';

function extractConteudo(file) {
  const html = readFileSync(file, 'utf8');
  const main = html.match(/<main class="page-content">([\s\S]*?)<\/main>/)[1];
  return main
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="subtitle">[\s\S]*?<\/p>/, '')
    .trim();
}

function b64(s) {
  return Buffer.from(s, 'utf8').toString('base64');
}

function halves(str) {
  const mid = Math.ceil(str.length / 2);
  return [str.slice(0, mid), str.slice(mid)];
}

const priv = extractConteudo('pages/politica-privacidade.html');
const termos = extractConteudo('pages/termos-uso.html');
const [pa, pb] = halves(b64(priv));
const [ta, tb] = halves(b64(termos));

writeFileSync(
  'tmp-priv-a.sql',
  `update public.paginas_legais set conteudo = convert_from(decode('${pa}', 'base64'), 'UTF8'), updated_at = now() where slug = 'politica-privacidade';`
);
writeFileSync(
  'tmp-priv-b.sql',
  `update public.paginas_legais set conteudo = coalesce(conteudo, '') || convert_from(decode('${pb}', 'base64'), 'UTF8'), updated_at = now() where slug = 'politica-privacidade';`
);
writeFileSync(
  'tmp-termos-a.sql',
  `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values (
  'termos',
  convert_from(decode('${b64('Termos de Uso e Condições Gerais de Viagem')}', 'base64'), 'UTF8'),
  'termos-uso',
  convert_from(decode('${b64('Maio de 2026')}', 'base64'), 'UTF8'),
  convert_from(decode('${ta}', 'base64'), 'UTF8'),
  true, 2
) on conflict (slug) do update set
  titulo = excluded.titulo,
  atualizacao = excluded.atualizacao,
  conteudo = excluded.conteudo,
  updated_at = now();`
);
writeFileSync(
  'tmp-termos-b.sql',
  `update public.paginas_legais set conteudo = coalesce(conteudo, '') || convert_from(decode('${tb}', 'base64'), 'UTF8'), updated_at = now() where slug = 'termos-uso';`
);

// Ensure privacidade row exists
writeFileSync(
  'tmp-priv-ensure.sql',
  `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values (
  'privacidade',
  convert_from(decode('${b64('Política de Privacidade e Cookies')}', 'base64'), 'UTF8'),
  'politica-privacidade',
  convert_from(decode('${b64('Maio de 2026')}', 'base64'), 'UTF8'),
  '',
  true, 1
) on conflict (slug) do nothing;`
);

console.log({
  privLen: priv.length,
  termosLen: termos.length,
  sizes: ['tmp-priv-ensure.sql', 'tmp-priv-a.sql', 'tmp-priv-b.sql', 'tmp-termos-a.sql', 'tmp-termos-b.sql'].map(
    (f) => [f, readFileSync(f).length]
  )
});
