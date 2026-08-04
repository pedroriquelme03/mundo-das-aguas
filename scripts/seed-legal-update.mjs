import { readFileSync, writeFileSync } from 'node:fs';

function extractConteudo(file) {
  const html = readFileSync(file, 'utf8');
  const main = html.match(/<main class="page-content">([\s\S]*?)<\/main>/)[1];
  return main
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="subtitle">[\s\S]*?<\/p>/, '')
    .trim();
}

const priv = Buffer.from(extractConteudo('pages/politica-privacidade.html'), 'utf8').toString('base64');
const termos = Buffer.from(extractConteudo('pages/termos-uso.html'), 'utf8').toString('base64');
writeFileSync('tmp-priv-c.b64', priv);
writeFileSync('tmp-termos-c.b64', termos);

writeFileSync(
  'tmp-upd-priv.sql',
  `update public.paginas_legais set conteudo = convert_from(decode('${priv}', 'base64'), 'UTF8'), updated_at = now() where slug = 'politica-privacidade';`
);
writeFileSync(
  'tmp-upd-termos.sql',
  `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values
('termos', convert_from(decode('VGVybW9zIGRlIFVzbyBlIENvbmRpw6fDtWVzIEdlcmFpcyBkZSBWaWFnZW0=', 'base64'), 'UTF8'), 'termos-uso', convert_from(decode('TWFpbyBkZSAyMDI2', 'base64'), 'UTF8'), convert_from(decode('${termos}', 'base64'), 'UTF8'), true, 2)
on conflict (slug) do update set titulo=excluded.titulo, atualizacao=excluded.atualizacao, conteudo=excluded.conteudo, updated_at=now();`
);

console.log('priv b64', priv.length, 'sql', readFileSync('tmp-upd-priv.sql').length);
console.log('termos b64', termos.length, 'sql', readFileSync('tmp-upd-termos.sql').length);
