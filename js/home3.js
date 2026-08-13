// Home 3 — caixa de busca (→ orçamento no WhatsApp) + notícias do blog.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const WA = (window.MDA_CONTACT && window.MDA_CONTACT.whatsapp_comercial) || '5545999677835';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Caixa de busca / orçamento ---------------- */
(function () {
  const form = document.getElementById('h3Search');
  if (!form) return;
  const tabs = form.querySelectorAll('.h3-search__tab');
  let cat = 'fretamento';
  const LABEL = { fretamento: 'fretamento', compras: 'excursão de compras', pescaria: 'pescaria', pacotes: 'pacote turístico' };

  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
    t.classList.add('is-active'); t.setAttribute('aria-selected', 'true');
    cat = t.dataset.cat;
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const destino = form.querySelector('#h3Destino').value.trim();
    const embarque = form.querySelector('#h3Embarque').value.trim();
    const data = form.querySelector('#h3Data').value;
    let msg = `Olá! Gostaria de um orçamento de ${LABEL[cat] || 'viagem'}`;
    if (destino) msg += ` para ${destino}`;
    if (embarque) msg += `, saindo de ${embarque}`;
    if (data) { const p = data.split('-'); msg += `, em ${p[2]}/${p[1]}/${p[0]}`; }
    msg += '.';
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();

/* ---------------- Notícias (blog) ---------------- */
(async function () {
  const grid = document.getElementById('h3News');
  if (!grid || !cfg.url || !cfg.anonKey) return;
  const CAT = { fretamento: 'Fretamento', compras: 'Compras', romarias: 'Romarias', pescarias: 'Pescarias', pacotes: 'Pacotes', dicas: 'Dicas', institucional: 'Institucional' };

  const fmtDate = (d) => { if (!d) return ''; const p = String(d).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };
  const imgUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (/^\/?(img|images)\//.test(path)) return path.startsWith('/') ? path : '/' + path;
    return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
  };

  try {
    const supabase = createClient(cfg.url, cfg.anonKey);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, titulo, resumo, categoria, imagem_path, data_publicacao')
      .eq('ativo', true)
      .order('data_publicacao', { ascending: false })
      .limit(3);
    if (error) throw error;
    if (!data || !data.length) { grid.innerHTML = '<p class="destinos__empty">Em breve novos conteúdos no nosso blog.</p>'; return; }

    grid.innerHTML = data.map((p) => {
      const url = imgUrl(p.imagem_path);
      const media = url ? `<div class="h3-news-card__media"><img src="${esc(url)}" alt="${esc(p.titulo)}" loading="lazy"></div>` : `<div class="h3-news-card__media"></div>`;
      return `
        <a class="h3-news-card" href="/blog-artigo?slug=${encodeURIComponent(p.slug)}">
          ${media}
          <div class="h3-news-card__body">
            <div class="h3-news-card__meta"><b>${esc(CAT[p.categoria] || 'Blog')}</b> ${esc(fmtDate(p.data_publicacao))}</div>
            <h3>${esc(p.titulo)}</h3>
            <p>${esc(p.resumo || '')}</p>
            <span class="h3-news-card__link">Saiba mais →</span>
          </div>
        </a>`;
    }).join('');
  } catch (err) {
    console.error('[home3 notícias]', err);
    grid.innerHTML = '<p class="destinos__empty">Não foi possível carregar as notícias agora.</p>';
  }
})();
