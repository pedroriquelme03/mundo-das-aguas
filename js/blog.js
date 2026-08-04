// Listagem do Blog — public.blog_posts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const featuredEl = document.getElementById('blogFeatured');
const gridEl = document.getElementById('blogGrid');
const maisEl = document.getElementById('blogMais');
const searchForm = document.getElementById('blogSearch');
const searchInput = document.getElementById('blogSearchInput');
const catsEl = document.getElementById('blogCats');

const CAT_LABEL = {
  fretamento: 'Fretamento B2B',
  compras: 'Compras',
  romarias: 'Romarias',
  pescarias: 'Pescarias',
  pacotes: 'Pacotes',
  dicas: 'Dicas',
  institucional: 'Institucional'
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtDate(d) {
  if (!d) return '';
  const p = String(d).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

function fotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
}

function href(post) {
  return `blog-artigo.html?slug=${encodeURIComponent(post.slug)}`;
}

function cardHtml(post, featured = false) {
  const foto = fotoUrl(post.imagem_path);
  const media = foto
    ? `<img src="${esc(foto)}" alt="${esc(post.titulo)}" loading="lazy">`
    : `<div class="blog-card__placeholder">✦</div>`;
  const meta = [
    post.tempo_leitura ? `${post.tempo_leitura} min` : null,
    fmtDate(post.data_publicacao)
  ].filter(Boolean).join(' · ');

  return `
    <article class="blog-card${featured ? ' blog-card--featured' : ''}">
      <a href="${href(post)}" class="blog-card__img">${media}</a>
      <div class="blog-card__body">
        <span class="blog-card__cat">${esc(CAT_LABEL[post.categoria] || post.categoria)}</span>
        <h3><a href="${href(post)}">${esc(post.titulo)}</a></h3>
        <p>${esc(post.resumo || '')}</p>
        ${meta ? `<span class="blog-card__meta">${esc(meta)}</span>` : ''}
        <a href="${href(post)}" class="blog-card__link">Ler artigo →</a>
      </div>
    </article>`;
}

function maisHtml(post) {
  return `
    <a class="blog-mais__item" href="${href(post)}">
      <span class="blog-card__cat">${esc(CAT_LABEL[post.categoria] || post.categoria)}</span>
      <strong>${esc(post.titulo)}</strong>
      ${post.tempo_leitura ? `<span class="blog-card__meta">${post.tempo_leitura} min</span>` : ''}
    </a>`;
}

let allPosts = [];
let currentCat = 'todos';
let query = '';

function filterPosts() {
  const q = query.toLowerCase();
  return allPosts.filter((p) => {
    if (currentCat !== 'todos' && p.categoria !== currentCat) return false;
    if (!q) return true;
    const hay = `${p.titulo} ${p.resumo || ''} ${CAT_LABEL[p.categoria] || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

function render() {
  const filtered = filterPosts();
  const destaques = filtered.filter((p) => p.destaque).slice(0, 3);
  const featuredSource = destaques.length ? destaques : filtered.slice(0, 3);

  if (featuredEl) {
    featuredEl.innerHTML = featuredSource.length
      ? featuredSource.map((p) => cardHtml(p, true)).join('')
      : '<p class="destinos__empty">Nenhum artigo em destaque nesta filtragem.</p>';
  }

  if (gridEl) {
    gridEl.innerHTML = filtered.length
      ? filtered.map((p) => cardHtml(p)).join('')
      : '<p class="destinos__empty">Nenhum artigo encontrado. Tente outra busca ou categoria.</p>';
  }

  if (maisEl) {
    const mais = allPosts.filter((p) => p.mais_lidos).slice(0, 5);
    const fallback = allPosts.slice(0, 5);
    const list = (mais.length ? mais : fallback);
    maisEl.innerHTML = list.length
      ? list.map(maisHtml).join('')
      : '<p class="destinos__empty">Em breve.</p>';
  }
}

async function load() {
  if (!cfg.url || !cfg.anonKey) {
    if (gridEl) gridEl.innerHTML = '<p class="destinos__empty">Configuração indisponível.</p>';
    return;
  }

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('data_publicacao', { ascending: false });

  if (error) {
    if (gridEl) gridEl.innerHTML = `<p class="destinos__empty">Erro ao carregar: ${esc(error.message)}</p>`;
    return;
  }

  allPosts = data || [];
  if (!allPosts.length) {
    const empty = '<p class="destinos__empty">Em breve novos conteúdos. Cadastre artigos no painel admin (aba Blog).</p>';
    if (featuredEl) featuredEl.innerHTML = empty;
    if (gridEl) gridEl.innerHTML = empty;
    if (maisEl) maisEl.innerHTML = empty;
    return;
  }
  render();
}

catsEl?.querySelectorAll('.blog-cat').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentCat = btn.dataset.cat || 'todos';
    catsEl.querySelectorAll('.blog-cat').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  query = (searchInput?.value || '').trim();
  render();
});

searchInput?.addEventListener('input', () => {
  query = searchInput.value.trim();
  render();
});

// deep-link ?cat=
const catParam = new URLSearchParams(location.search).get('cat');
if (catParam && CAT_LABEL[catParam]) {
  currentCat = catParam;
  catsEl?.querySelectorAll('.blog-cat').forEach((b) => b.classList.toggle('active', b.dataset.cat === catParam));
}

load();
