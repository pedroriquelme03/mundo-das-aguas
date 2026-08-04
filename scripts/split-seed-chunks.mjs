import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('tmp', { recursive: true });

function splitJson(src, prefix, slug, mode) {
  const q = JSON.parse(readFileSync(src, 'utf8')).q;
  const matches = [...q.matchAll(/decode\('([^']+)', 'base64'\)/g)].map((m) => m[1]);
  // For termos-a the last long match(es) are content; for priv-a there's one long match
  const long = matches.filter((m) => m.length > 200);
  const b64 = mode === 'append-half' ? long[0] : long[long.length - 1] || long[0];
  if (!b64) throw new Error('no b64 in ' + src);

  const n = 3;
  const size = Math.ceil(b64.length / n);
  for (let i = 0; i < n; i++) {
    const p = b64.slice(i * size, (i + 1) * size);
    let sql;
    if (mode === 'replace' && i === 0) {
      sql = `update public.paginas_legais set conteudo = convert_from(decode('${p}', 'base64'), 'UTF8'), updated_at = now() where slug = '${slug}';`;
    } else {
      sql = `update public.paginas_legais set conteudo = coalesce(conteudo, '') || convert_from(decode('${p}', 'base64'), 'UTF8'), updated_at = now() where slug = '${slug}';`;
    }
    const file = `tmp/${prefix}-${i}.sql`;
    writeFileSync(file, sql);
    console.log(file, sql.length);
  }
}

function writeTermosInsertFirstHalf() {
  const q = JSON.parse(readFileSync('tmp-termos-a.sql.json', 'utf8')).q;
  // Use the full insert but only first content half is already in tmp-termos-a
  // Split content of insert into replace+append after a minimal insert
  writeFileSync(
    'tmp/termos-ensure.sql',
    `insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values (
  'termos',
  convert_from(decode('VGVybW9zIGRlIFVzbyBlIENvbmRpw6fDtWVzIEdlcmFpcyBkZSBWaWFnZW0=', 'base64'), 'UTF8'),
  'termos-uso',
  convert_from(decode('TWFpbyBkZSAyMDI2', 'base64'), 'UTF8'),
  '',
  true, 2
) on conflict (slug) do update set titulo = excluded.titulo, atualizacao = excluded.atualizacao, updated_at = now();`
  );
  console.log('tmp/termos-ensure.sql');
}

writeTermosInsertFirstHalf();

// priv-a is first half of privacy (replace), priv-b is second half (append)
const privA = JSON.parse(readFileSync('tmp-priv-a.sql.json', 'utf8')).q.match(/decode\('([^']+)', 'base64'\)/)[1];
const privB = JSON.parse(readFileSync('tmp-priv-b.sql.json', 'utf8')).q.match(/decode\('([^']+)', 'base64'\)/)[1];
const termosA = [...JSON.parse(readFileSync('tmp-termos-a.sql.json', 'utf8')).q.matchAll(/decode\('([^']+)', 'base64'\)/g)].map((m) => m[1]).filter((m) => m.length > 200)[0];
const termosB = JSON.parse(readFileSync('tmp-termos-b.sql.json', 'utf8')).q.match(/decode\('([^']+)', 'base64'\)/)[1];

function emitParts(b64, prefix, slug, startReplace) {
  const n = 3;
  const size = Math.ceil(b64.length / n);
  for (let i = 0; i < n; i++) {
    const p = b64.slice(i * size, (i + 1) * size);
    const sql =
      startReplace && i === 0
        ? `update public.paginas_legais set conteudo = convert_from(decode('${p}', 'base64'), 'UTF8'), updated_at = now() where slug = '${slug}';`
        : `update public.paginas_legais set conteudo = coalesce(conteudo, '') || convert_from(decode('${p}', 'base64'), 'UTF8'), updated_at = now() where slug = '${slug}';`;
    writeFileSync(`tmp/${prefix}-${i}.sql`, sql);
    console.log(`tmp/${prefix}-${i}.sql`, sql.length);
  }
}

emitParts(privA, 'priv-a', 'politica-privacidade', true);
emitParts(privB, 'priv-b', 'politica-privacidade', false);
emitParts(termosA, 'termos-a', 'termos-uso', true);
emitParts(termosB, 'termos-b', 'termos-uso', false);
