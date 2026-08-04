// Artigo do Blog — pages/blog-artigo.html?slug=
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const root = document.getElementById('artigoRoot');
const slug = new URLSearchParams(location.search).get('slug')?.trim() || '';

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

/** Conteúdo simples: parágrafos separados por linha em branco; linhas # viram h2. */
function renderContent(text) {
  if (!text) return '<p>Conteúdo em breve.</p>';
  const blocks = String(text).split(/\n{2,}/);
  return blocks.map((block) => {
    const t = block.trim();
    if (!t) return '';
    if (t.startsWith('## ')) return `<h2>${esc(t.slice(3))}</h2>`;
    if (t.startsWith('# ')) return `<h2>${esc(t.slice(2))}</h2>`;
    if (t.startsWith('- ')) {
      const items = t.split('\n').map((l) => l.replace(/^- /, '').trim()).filter(Boolean);
      return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    }
    return `<p>${esc(t).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function render(post, related) {
  const capa = fotoUrl(post.imagem_path);
  const cat = CAT_LABEL[post.categoria] || post.categoria;
  document.title = `${post.titulo} | Mundo das Águas Turismo`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', post.resumo || post.titulo);

  root.innerHTML = `
    <section class="page-banner">
      <div class="page-banner__bg">
        ${capa ? `<img src="${esc(capa)}" alt="${esc(post.titulo)}" loading="eager">` : ''}
        <div class="page-banner__overlay"></div>
      </div>
      <div class="container page-banner__content">
        <span class="section-tag">${esc(cat)}</span>
        <h1>${esc(post.titulo)}</h1>
        <p class="blog-artigo__meta">
          ${post.tempo_leitura ? `${post.tempo_leitura} min de leitura` : ''}
          ${post.data_publicacao ? ` · ${fmtDate(post.data_publicacao)}` : ''}
        </p>
      </div>
    </section>

    <main class="page-main">
      <article class="blog-artigo">
        <div class="container blog-artigo__wrap">
          ${post.resumo ? `<p class="blog-artigo__intro">${esc(post.resumo)}</p>` : ''}
          <div class="blog-artigo__content">${renderContent(post.conteudo)}</div>

          <div class="blog-banner-cta blog-banner-cta--inline">
            <div>
              <h3>Gostou do conteúdo?</h3>
              <p>Fale com a equipe e planeje sua próxima viagem com a Mundo das Águas.</p>
            </div>
            <a href="https://wa.me/5545999677835?text=${encodeURIComponent('Olá! Li o artigo "' + post.titulo + '" e quero mais informações.')}" class="btn btn--whatsapp btn--lg" target="_blank" rel="noopener">Falar no WhatsApp</a>
          </div>

          ${related.length ? `
          <aside class="blog-related">
            <h2>Artigos relacionados</h2>
            <div class="blog__grid blog__grid--related">
              ${related.map((r) => `
                <a class="blog-mais__item" href="blog-artigo.html?slug=${encodeURIComponent(r.slug)}">
                  <span class="blog-card__cat">${esc(CAT_LABEL[r.categoria] || r.categoria)}</span>
                  <strong>${esc(r.titulo)}</strong>
                </a>`).join('')}
            </div>
          </aside>` : ''}

          <p style="margin-top:28px"><a href="blog.html" class="btn btn--outline">← Voltar ao Blog</a></p>
        </div>
      </article>
    </main>`;
}

function renderError(msg) {
  root.innerHTML = `
    <section class="page-banner">
      <div class="page-banner__bg"><div class="page-banner__overlay"></div></div>
      <div class="container page-banner__content">
        <h1>Artigo não encontrado</h1>
        <p>${esc(msg)}</p>
        <a href="blog.html" class="btn btn--white" style="margin-top:16px">Voltar ao Blog</a>
      </div>
    </section>`;
}

async function load() {
  if (!root) return;
  if (!slug) { renderError('Informe o slug na URL.'); return; }
  if (!cfg.url || !cfg.anonKey) { renderError('Configuração indisponível.'); return; }

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle();

  if (error) { renderError(error.message); return; }
  if (!data) { renderError('Não encontramos este artigo.'); return; }

  const { data: related } = await supabase
    .from('blog_posts')
    .select('slug,titulo,categoria')
    .eq('ativo', true)
    .eq('categoria', data.categoria)
    .neq('id', data.id)
    .order('ordem', { ascending: true })
    .limit(3);

  render(data, related || []);
}

load();
