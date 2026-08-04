import fs from 'fs';
import crypto from 'crypto';

function check(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /decode\('([^']+)',\s*'base64'\)/g;
  let m;
  const parts = [];
  while ((m = re.exec(txt))) {
    parts.push(Buffer.from(m[1], 'base64').toString('utf8'));
  }
  const full = parts.join('');
  console.log('---', file, '---');
  console.log('chunks:', parts.length);
  parts.forEach((p, i) => console.log('  part', i, 'len', p.length));
  console.log('total len:', full.length);
  console.log('md5:', crypto.createHash('md5').update(full, 'utf8').digest('hex'));
}

check('tmp-upd-priv-2.sql');
check('tmp-upd-termos-2.sql');
