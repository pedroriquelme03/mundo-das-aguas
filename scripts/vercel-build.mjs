import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

console.log('==> Montando pasta public/ para o Vercel');
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

const siteItems = [
  'index.html',
  'css',
  'js',
  'pages',
  'images',
  'img',
  'bio',
  'home2',
  'home3',
  'frota',
  'quem-somos',
  'blog',
  'contato',
  'servicos',
  'reservas',
  'excursao',
  'venda-veiculos',
  'politica-privacidade',
  'termos-uso'
];
for (const item of siteItems) {
  const src = join(root, item);
  if (existsSync(src)) {
    cpSync(src, join(publicDir, item), { recursive: true });
  }
}

for (const item of ['robots.txt', 'favicon.ico', 'sitemap.xml']) {
  const src = join(root, item);
  if (existsSync(src)) cpSync(src, join(publicDir, item));
}

console.log('==> Build do painel admin (Vite)');
const adminDir = join(root, 'admin');
execSync('npm install', { cwd: adminDir, stdio: 'inherit' });
execSync('npm run build', { cwd: adminDir, stdio: 'inherit' });

const adminOut = join(publicDir, 'admin');
mkdirSync(adminOut, { recursive: true });
cpSync(join(adminDir, 'dist'), adminOut, { recursive: true });

console.log('==> public/ pronto');
console.log('site:', readdirSync(publicDir).join(', '));
console.log('admin:', readdirSync(adminOut).join(', '));
