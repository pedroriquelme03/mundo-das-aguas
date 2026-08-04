import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(d, acc = []) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'public', 'admin', '.git'].includes(e.name)) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

let n = 0;
for (const f of walk('.')) {
  let c = readFileSync(f, 'utf8');
  const o = c;
  c = c.replaceAll('href="/""', 'href="/"');
  c = c.replaceAll("href='/''", "href='/'");
  if (c !== o) {
    writeFileSync(f, c);
    n++;
    console.log('fixed', f);
  }
}
console.log('total', n);
