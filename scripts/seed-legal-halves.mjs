import { readFileSync, writeFileSync } from 'node:fs';

function extractConteudo(file) {
  const html = readFileSync(file, 'utf8');
  const main = html.match(/<main class="page-content">([\s\S]*?)<\/main>/)[1];
  return main
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="subtitle">[\s\S]*?<\/p>/, '')
    .trim();
}

function halves(b64) {
  const mid = Math.ceil(b64.length / 2);
  return [b64.slice(0, mid), b64.slice(mid)];
}

function updateSql(slug, conteudo) {
  const b64 = Buffer.from(conteudo, 'utf8').toString('base64');
  const [a, b] = halves(b64);
  return `update public.paginas_legais set
  conteudo = convert_from(decode('${a}', 'base64'), 'UTF8') || convert_from(decode('${b}', 'base64'), 'UTF8'),
  updated_at = now()
where slug = '${slug}';`;
}

function insertTermos(conteudo) {
  const b64 = Buffer.from(conteudo, 'utf8').toString('base64');
  const [a, b] = halves(b64);
  return `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values
('termos',
 convert_from(decode('VGVybW9zIGRlIFVzbyBlIENvbmRpw6fDtWVzIEdlcmFpcyBkZSBWaWFnZW0=', 'base64'), 'UTF8'),
 'termos-uso',
 convert_from(decode('TWFpbyBkZSAyMDI2', 'base64'), 'UTF8'),
 convert_from(decode('${a}', 'base64'), 'UTF8') || convert_from(decode('${b}', 'base64'), 'UTF8'),
 true, 2)
on conflict (slug) do update set
  titulo = excluded.titulo,
  atualizacao = excluded.atualizacao,
  conteudo = excluded.conteudo,
  updated_at = now();`;
}

const priv = extractConteudo('pages/politica-privacidade.html');
const termos = extractConteudo('pages/termos-uso.html');
writeFileSync('tmp-upd-priv-2.sql', updateSql('politica-privacidade', priv));
writeFileSync('tmp-upd-termos-2.sql', insertTermos(termos));
console.log(readFileSync('tmp-upd-priv-2.sql').length, readFileSync('tmp-upd-termos-2.sql').length);
