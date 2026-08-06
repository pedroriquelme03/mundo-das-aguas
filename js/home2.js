// Home 2 — carrossel do hero + notícias (blog) dinâmicas.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Hero carrossel ---------------- */
(function () {
  const slidesWrap = document.getElementById('h2HeroSlides');
  if (!slidesWrap) return;
  const slides = Array.from(slidesWrap.querySelectorAll('.h2-hero__slide'));
  const titleEl = document.getElementById('h2HeroTitle');
  const textEl = document.getElementById('h2HeroText');
  const dotsWrap = document.getElementById('h2HeroDots');
  const prev = document.getElementById('h2HeroPrev');
  const next = document.getElementById('h2HeroNext');

  const copy = [
    { title: 'Viaje em grande estilo <span>com frota própria e conforto.</span>',
      text: 'Fretamento, excursões de compras e turismo rodoviário para grupos, pelo Brasil e Mercosul — com Internet Starlink e acompanhamento durante toda a viagem.' },
    { title: 'Excursões de compras <span>para os maiores polos do Brasil.</span>',
      text: 'Saídas programadas para Brás, Bom Retiro, Goiânia, Monte Sião e outros destinos, com embarques organizados.' },
    { title: 'Pacotes e romarias <span>organizados do início ao fim.</span>',
      text: 'Roteiros pelo Brasil e Mercosul com hospedagem, guia e toda a estrutura para o seu grupo viajar tranquilo.' }
  ];

  let i = 0, timer = null;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  dotsWrap.innerHTML = slides.map((_, n) =>
    `<button class="h2-hero__dot${n === 0 ? ' is-active' : ''}" data-n="${n}" aria-label="Slide ${n + 1}"></button>`).join('');
  const dots = Array.from(dotsWrap.children);

  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    if (copy[i]) { titleEl.innerHTML = copy[i].title; textEl.textContent = copy[i].text; }
  }
  function start() { if (!reduce) { stop(); timer = setInterval(() => go(i + 1), 6000); } }
  function stop() { if (timer) clearInterval(timer); }

  prev && prev.addEventListener('click', () => { go(i - 1); start(); });
  next && next.addEventListener('click', () => { go(i + 1); start(); });
  dots.forEach((d) => d.addEventListener('click', () => { go(+d.dataset.n); start(); }));
  document.getElementById('h2Hero').addEventListener('mouseenter', stop);
  document.getElementById('h2Hero').addEventListener('mouseleave', start);

  start();
})();

/* ---------------- Notícias (blog) ---------------- */
(async function () {
  const grid = document.getElementById('h2News');
  if (!grid || !cfg.url || !cfg.anonKey) return;

  const CAT = { fretamento: 'Fretamento', compras: 'Compras', romarias: 'Romarias', pescarias: 'Pescarias', pacotes: 'Pacotes', dicas: 'Dicas', institucional: 'Institucional' };

  function fmtDate(d) {
    if (!d) return '';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  }
  function imgUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/img') || path.startsWith('/images') || path.startsWith('img/') || path.startsWith('images/')) {
      return path.startsWith('/') ? path : '/' + path;
    }
    return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
  }

  try {
    const supabase = createClient(cfg.url, cfg.anonKey);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, titulo, resumo, categoria, imagem_path, data_publicacao')
      .eq('ativo', true)
      .order('data_publicacao', { ascending: false })
      .limit(3);
    if (error) throw error;

    if (!data || !data.length) {
      grid.innerHTML = '<p class="destinos__empty">Em breve novos conteúdos no nosso blog.</p>';
      return;
    }

    grid.innerHTML = data.map((p) => {
      const url = imgUrl(p.imagem_path);
      const media = url
        ? `<div class="h2-news-card__media"><img src="${esc(url)}" alt="${esc(p.titulo)}" loading="lazy"></div>`
        : `<div class="h2-news-card__media"></div>`;
      return `
        <a class="h2-news-card" href="/blog-artigo?slug=${encodeURIComponent(p.slug)}">
          ${media}
          <div class="h2-news-card__body">
            <div class="h2-news-card__meta"><span class="h2-news-card__cat">${esc(CAT[p.categoria] || 'Blog')}</span><span>${esc(fmtDate(p.data_publicacao))}</span></div>
            <h3 class="h2-news-card__title">${esc(p.titulo)}</h3>
            <p class="h2-news-card__excerpt">${esc(p.resumo || '')}</p>
            <span class="h2-news-card__link">Saiba mais →</span>
          </div>
        </a>`;
    }).join('');
  } catch (err) {
    console.error('[home2 notícias]', err);
    grid.innerHTML = '<p class="destinos__empty">Não foi possível carregar as notícias agora.</p>';
  }
})();
