/**
 * Migra pages/*.html → pastas com URLs limpas (/frota, /contato, …)
 * e reescreve links/assets para caminhos absolutos.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = join(root, 'pages');

/** arquivo em pages/ → rota limpa (pasta relativa à raiz do site) */
const MAP = {
  'frota.html': 'frota',
  'quem-somos.html': 'quem-somos',
  'blog.html': 'blog',
  'blog-artigo.html': 'blog/artigo',
  'contato.html': 'contato',
  'servicos.html': 'servicos',
  'reservas.html': 'reservas',
  'excursao.html': 'excursao',
  'venda-veiculos.html': 'venda-veiculos',
  'politica-privacidade.html': 'politica-privacidade',
  'termos-uso.html': 'termos-uso',
  'blog-bras.html': 'blog/bras',
  'blog-aparecida.html': 'blog/aparecida',
  'blog-dicas-viagem.html': 'blog/dicas-viagem',
  'blog-mercosul.html': 'blog/mercosul',
  'blog-paraguai.html': 'blog/paraguai',
  'blog-pescaria.html': 'blog/pescaria'
};

function rewriteHtml(html, fromFile) {
  let out = html;

  // Assets → absolutos
  out = out
    .replace(/(href|src)=["']\.\.\/css\//g, '$1="/css/')
    .replace(/(href|src)=["']\.\.\/js\//g, '$1="/js/')
    .replace(/(href|src)=["']\.\.\/images\//g, '$1="/images/')
    .replace(/(href|src)=["']\.\.\/img\//g, '$1="/img/')
    .replace(/(href|src)=["']\.\.\/index\.html/g, '$1="/"')
    .replace(/(href|src)=["']\.\.\/(["'#])/g, '$1="/$2');

  // Home relativo em páginas (já coberto)

  // Links entre páginas (mesmo diretório pages/ ou relativos)
  // blog-artigo.html?slug= → /blog/artigo?slug=
  out = out.replace(/href=["']blog-artigo\.html(\?[^"']*)?["']/g, 'href="/blog/artigo$1"');
  out = out.replace(/href=["']excursao\.html(\?[^"']*)?["']/g, 'href="/excursao$1"');

  for (const [file, route] of Object.entries(MAP)) {
    const base = file.replace(/\.html$/, '');
    // href="frota.html" / href="frota.html#x" / href="./frota.html"
    const re1 = new RegExp(`href=["'](?:\\.\\/)?${base}\\.html(#[^"']*)?["']`, 'g');
    out = out.replace(re1, `href="/${route}$1"`);
    // href="../pages/frota.html" won't appear in pages files
  }

  // data-nav and body attributes stay

  // Canonical / titles untouched

  // Special: links.html → /bio
  out = out.replace(/href=["'](?:\.\/)?links\.html["']/g, 'href="/bio"');

  // Fix leftover ../index.html in text
  out = out.replace(/href=["']\.\.\/index\.html["']/g, 'href="/"');

  return out;
}

function rewriteIndex(html) {
  let out = html;
  out = out.replace(/href=["']pages\/blog-artigo\.html(\?[^"']*)?["']/g, 'href="/blog/artigo$1"');
  out = out.replace(/href=["']pages\/excursao\.html(\?[^"']*)?["']/g, 'href="/excursao$1"');
  for (const [file, route] of Object.entries(MAP)) {
    const re = new RegExp(`href=["']pages\\/${file.replace('.', '\\.')}(#[^"']*)?["']`, 'g');
    out = out.replace(re, `href="/${route}$1"`);
  }
  out = out.replace(/href=["']pages\/links\.html["']/g, 'href="/bio"');
  // index.html self refs can stay or become /
  out = out.replace(/href=["']index\.html["']/g, 'href="/"');
  return out;
}

function rewriteJs(content) {
  let out = content;
  out = out
    .replace(/pages\/excursao\.html/g, 'excursao')
    .replace(/pages\/blog-artigo\.html/g, 'blog/artigo')
    .replace(/pages\/frota\.html/g, 'frota')
    .replace(/pages\/blog\.html/g, 'blog')
    .replace(/pages\/servicos\.html/g, 'servicos')
    .replace(/pages\/contato\.html/g, 'contato')
    .replace(/pages\/reservas\.html/g, 'reservas')
    .replace(/pages\/quem-somos\.html/g, 'quem-somos')
    .replace(/pages\/venda-veiculos\.html/g, 'venda-veiculos')
    .replace(/pages\/politica-privacidade\.html/g, 'politica-privacidade')
    .replace(/pages\/termos-uso\.html/g, 'termos-uso')
    .replace(/pages\/links\.html/g, 'bio');

  // relative links from JS that build pages/
  out = out.replace(/`pages\/excursao\.html\?slug=/g, '`/excursao?slug=');
  out = out.replace(/`pages\/blog-artigo\.html\?slug=/g, '`/blog/artigo?slug=');
  out = out.replace(/'pages\/excursao\.html\?slug=/g, "'/excursao?slug=");
  out = out.replace(/"pages\/excursao\.html\?slug=/g, '"/excursao?slug=');
  out = out.replace(/href\(post\)|blog-artigo\.html\?slug=/g, (m) => m);

  // pacotes-home and blog.js patterns
  out = out.replace(/pages\/excursao\.html\?slug=\$\{/g, '/excursao?slug=${');
  out = out.replace(/blog-artigo\.html\?slug=\$\{/g, '/blog/artigo?slug=${');
  out = out.replace(/const href = `\$\{base\}excursao\.html\?slug=/g, 'const href = `/excursao?slug=');
  out = out.replace(/return `blog-artigo\.html\?slug=/g, 'return `/blog/artigo?slug=');
  out = out.replace(/href = `pages\/excursao\.html\?slug=/g, 'href = `/excursao?slug=');

  return out;
}

// 1) Migrate pages
for (const [file, route] of Object.entries(MAP)) {
  const src = join(pagesDir, file);
  if (!existsSync(src)) {
    console.warn('skip missing', file);
    continue;
  }
  const html = rewriteHtml(readFileSync(src, 'utf8'), file);
  const destDir = join(root, ...route.split('/'));
  mkdirSync(destDir, { recursive: true });
  const dest = join(destDir, 'index.html');
  writeFileSync(dest, html);
  console.log('ok', file, '→', `/${route}/`);
}

// 2) Rewrite index.html
const indexPath = join(root, 'index.html');
writeFileSync(indexPath, rewriteIndex(readFileSync(indexPath, 'utf8')));
console.log('ok index.html');

// 3) Rewrite bio
const bioPath = join(root, 'bio', 'index.html');
if (existsSync(bioPath)) {
  let bio = readFileSync(bioPath, 'utf8');
  bio = bio
    .replace(/href="\.\.\/css\//g, 'href="/css/')
    .replace(/src="\.\.\/images\//g, 'src="/images/')
    .replace(/src="\.\.\/js\//g, 'src="/js/');
  writeFileSync(bioPath, bio);
  console.log('ok bio/index.html');
}

// 4) Leave redirect stubs in pages/ for old URLs (except we'll also use vercel redirects)
for (const [file, route] of Object.entries(MAP)) {
  const stub = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/${route}">
  <link rel="canonical" href="/${route}">
  <title>Redirecionando…</title>
  <script>location.replace('/${route}' + location.search + location.hash);</script>
</head>
<body>
  <p>Redirecionando para <a href="/${route}">/${route}</a>…</p>
</body>
</html>
`;
  writeFileSync(join(pagesDir, file), stub);
}
console.log('ok pages/* stubs');

// 5) JS files
const jsFiles = [
  'js/blog.js',
  'js/blog-artigo.js',
  'js/pacotes-home.js',
  'js/excursoes-compras.js',
  'js/excursao.js',
  'js/frota.js',
  'js/bio.js',
  'js/main.js',
  'js/site-contact.js',
  'js/contato.js'
];
for (const f of jsFiles) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  const before = readFileSync(p, 'utf8');
  let after = rewriteJs(before);
  // specific fixes
  after = after.replace(
    /return `blog-artigo\.html\?slug=\$\{encodeURIComponent\(post\.slug\)\}`;/g,
    'return `/blog/artigo?slug=${encodeURIComponent(post.slug)}`;'
  );
  after = after.replace(
    /const href = `\$\{base\}excursao\.html\?slug=\$\{encodeURIComponent\(ex\.slug\)\}`;/g,
    'const href = `/excursao?slug=${encodeURIComponent(ex.slug)}`;'
  );
  after = after.replace(
    /const base = location\.pathname\.includes\('\/pages\/'\) \? '' : 'pages\/';\s*const href = `\$\{base\}excursao\.html\?slug=/g,
    'const href = `/excursao?slug='
  );
  if (after !== before) {
    writeFileSync(p, after);
    console.log('ok', f);
  }
}

console.log('done');
