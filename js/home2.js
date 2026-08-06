// Home 2 — carrossel do hero + notícias (blog) dinâmicas.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderDestinosSlider } from './destinos-slider.js';

const cfg = window.MDA_SUPABASE || {};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Hero: fundo por aba da busca (main.js) ---------------- */
/* O carrossel automático foi substituído pela barra de pesquisa. */

/* ---------------- Luzes laranja: seguem o mouse (leve) ---------------- */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const sel = '.h2-band-sunset--soft, .h2-encomendas, .h2-merco, .h2-social';
  const max = 28;

  document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      el.style.setProperty('--glow-x', `${(nx * max).toFixed(1)}px`);
      el.style.setProperty('--glow-y', `${(ny * max).toFixed(1)}px`);
      el.style.setProperty('--glow-x2', `${(-nx * max * 0.7).toFixed(1)}px`);
      el.style.setProperty('--glow-y2', `${(-ny * max * 0.7).toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--glow-x', '0px');
      el.style.setProperty('--glow-y', '0px');
      el.style.setProperty('--glow-x2', '0px');
      el.style.setProperty('--glow-y2', '0px');
    });
  });
})();

/* ---------------- Notícias (blog) — carrossel como Pacotes ---------------- */
(async function () {
  const track = document.getElementById('h2News');
  if (!track || !cfg.url || !cfg.anonKey) return;

  const CAT = { fretamento: 'Fretamento', compras: 'Compras', romarias: 'Romarias', pescarias: 'Pescarias', pacotes: 'Pacotes', dicas: 'Dicas', institucional: 'Institucional' };
  const limit = parseInt(track.dataset.limit || '12', 10);

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
      .limit(limit);
    if (error) throw error;

    if (!data || !data.length) {
      track.innerHTML = '<p class="destinos__empty">Em breve novos conteúdos no nosso blog.</p>';
      return;
    }

    const cardsHtml = data.map((p) => {
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

    renderDestinosSlider(track, cardsHtml);
  } catch (err) {
    console.error('[home2 notícias]', err);
    track.innerHTML = '<p class="destinos__empty">Não foi possível carregar as notícias agora.</p>';
  }
})();
