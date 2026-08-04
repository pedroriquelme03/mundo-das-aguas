// Template padrão de excursão/pacote — carrega por ?slug=
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const root = document.getElementById('excursaoRoot');
const params = new URLSearchParams(location.search);
const slug = (params.get('slug') || '').trim();

const CAT_LABEL = {
  compras: 'Excursão de Compras',
  romaria: 'Romaria',
  pescaria: 'Pescaria',
  nacional: 'Turismo Nacional',
  internacional: 'Turismo Internacional',
  pacote: 'Pacote Turístico'
};

const WA = '5545999677835';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtDate(d) {
  if (!d) return null;
  const p = String(d).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

function fotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
}

function reservaHref(ex) {
  if (ex.link_reserva) return ex.link_reserva;
  const msg = `Olá! Quero reservar / saber mais sobre: ${ex.nome}`;
  return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}

function listHtml(items, empty = '') {
  if (!items || !items.length) return empty;
  return `<ul class="ex-list">${items.map((i) => `<li><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${esc(i)}</li>`).join('')}</ul>`;
}

function render(ex, related) {
  const capa = fotoUrl(ex.foto_capa_path);
  const periodo = ex.periodo_texto
    || [fmtDate(ex.data_saida), fmtDate(ex.data_retorno)].filter(Boolean).join(' — ')
    || 'Período a definir';
  const cat = CAT_LABEL[ex.categoria] || ex.categoria;
  const galeria = (ex.galeria && ex.galeria.length)
    ? ex.galeria
    : (ex.foto_capa_path ? [ex.foto_capa_path] : []);

  document.title = `${ex.nome} | Mundo das Águas Turismo`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', ex.sobre || `${cat}: ${ex.nome}`);

  root.innerHTML = `
    <section class="page-banner">
      <div class="page-banner__bg">
        ${capa
          ? `<img src="${esc(capa)}" alt="${esc(ex.nome)}" loading="eager">`
          : `<div class="img-placeholder" style="min-height:280px">Sem imagem</div>`}
        <div class="page-banner__overlay"></div>
      </div>
      <div class="container page-banner__content ex-hero">
        <span class="section-tag">${esc(cat)}</span>
        <h1>${esc(ex.nome)}</h1>
        <p class="ex-hero__periodo">${esc(periodo)}</p>
        <div class="ex-hero__btns">
          <a href="${esc(reservaHref(ex))}" class="btn btn--whatsapp btn--lg" target="_blank" rel="noopener">Reservar pelo WhatsApp</a>
          <a href="#sobre" class="btn btn--white btn--lg">Ver detalhes</a>
        </div>
      </div>
    </section>

    <main class="page-main">
      ${ex.resumo?.length ? `
      <section class="ex-resumo sec-warm">
        <div class="container">
          <div class="ex-resumo__grid">
            ${ex.resumo.map((r) => `<div class="ex-resumo__item"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>${esc(r)}</span></div>`).join('')}
          </div>
        </div>
      </section>` : ''}

      <section class="ex-block sec-white" id="sobre">
        <div class="container ex-grid">
          <div>
            <span class="section-tag">Sobre a excursão</span>
            <h2 class="section-title" style="text-align:left">O que você precisa saber</h2>
            <p class="ex-sobre">${esc(ex.sobre || 'Consulte nossa equipe para detalhes desta viagem.')}</p>
            ${ex.cidade_embarque ? `<p class="ex-meta"><strong>Embarque:</strong> ${esc(ex.cidade_embarque)}</p>` : ''}
            ${ex.cidade_estado ? `<p class="ex-meta"><strong>Destino:</strong> ${esc(ex.cidade_estado)}</p>` : ''}
          </div>
          <div>
            <h3 class="ex-subtitle">O que está incluso</h3>
            ${listHtml(ex.incluso, '<p class="muted">Itens inclusos a confirmar.</p>')}
          </div>
        </div>
      </section>

      ${ex.roteiro?.length ? `
      <section class="ex-block ex-block--alt">
        <div class="container">
          <span class="section-tag">Roteiro</span>
          <h2 class="section-title">Roteiro por dias</h2>
          <ol class="ex-roteiro">
            ${ex.roteiro.map((r) => `
              <li>
                <span class="ex-roteiro__dia">${esc(r.dia || '')}</span>
                <div>
                  <h3>${esc(r.titulo || '')}</h3>
                  <p>${esc(r.descricao || '')}</p>
                </div>
              </li>`).join('')}
          </ol>
        </div>
      </section>` : ''}

      ${galeria.length ? `
      <section class="ex-block sec-white">
        <div class="container">
          <span class="section-tag">Galeria</span>
          <h2 class="section-title">Fotos da viagem</h2>
          <div class="ex-galeria">
            ${galeria.map((g, i) => {
              const u = fotoUrl(g);
              return u ? `<figure><img src="${esc(u)}" alt="Foto ${i + 1} — ${esc(ex.nome)}" loading="lazy"></figure>` : '';
            }).join('')}
          </div>
        </div>
      </section>` : ''}

      <section class="ex-block ex-block--alt">
        <div class="container ex-grid">
          <div>
            <h3 class="ex-subtitle">Informações importantes</h3>
            ${listHtml(ex.infos_importantes, '<p class="muted">Consulte a equipe para regras e documentos.</p>')}
          </div>
          <div>
            <h3 class="ex-subtitle">Formas de pagamento</h3>
            <p class="ex-sobre">${esc(ex.formas_pagamento || 'Consulte valores e condições pelo WhatsApp.')}</p>
          </div>
        </div>
      </section>

      <section class="cta-final">
        <div class="container">
          <h2>Reserve sua vaga</h2>
          <p>${esc(ex.nome)} — ${esc(periodo)}</p>
          <div class="cta-final__btns">
            <a href="${esc(reservaHref(ex))}" class="btn btn--whatsapp btn--lg" target="_blank" rel="noopener">Reservar pelo WhatsApp</a>
            <a href="contato.html" class="btn btn--white btn--lg">Falar com a equipe</a>
          </div>
        </div>
      </section>

      ${related.length ? `
      <section class="ex-block sec-white">
        <div class="container">
          <span class="section-tag">Relacionadas</span>
          <h2 class="section-title">Outras excursões</h2>
          <div class="destinos__grid">
            ${related.map((r) => {
              const foto = fotoUrl(r.foto_capa_path);
              const media = foto
                ? `<img src="${esc(foto)}" alt="${esc(r.nome)}" loading="lazy">`
                : `<div class="img-placeholder">Foto</div>`;
              return `<article class="destino-card">
                <div class="destino-card__media">
                  <span class="destino-card__cat">${esc(CAT_LABEL[r.categoria] || r.categoria)}</span>
                  ${media}
                </div>
                <div class="destino-card__body">
                  <h3 class="destino-card__title">${esc(r.nome)}</h3>
                  <p class="destino-card__local">${esc(r.cidade_estado || '')}</p>
                  <a href="excursao.html?slug=${encodeURIComponent(r.slug)}" class="btn btn--outline">Saiba mais</a>
                </div>
              </article>`;
            }).join('')}
          </div>
        </div>
      </section>` : ''}
    </main>`;
}

function renderError(msg) {
  root.innerHTML = `
    <section class="page-banner">
      <div class="page-banner__bg"><div class="page-banner__overlay"></div></div>
      <div class="container page-banner__content">
        <h1>Excursão não encontrada</h1>
        <p>${esc(msg)}</p>
        <a href="servicos.html" class="btn btn--white" style="margin-top:16px">Ver serviços</a>
      </div>
    </section>`;
}

async function load() {
  if (!root) return;
  if (!slug) {
    renderError('Informe o slug na URL, por exemplo: excursao.html?slug=aparecida');
    return;
  }
  if (!cfg.url || !cfg.anonKey) {
    renderError('Configuração do Supabase ausente.');
    return;
  }

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await supabase
    .from('excursoes')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    renderError(error.message);
    return;
  }
  if (!data) {
    renderError('Não encontramos uma excursão ativa com este endereço.');
    return;
  }

  const { data: related } = await supabase
    .from('excursoes')
    .select('slug,nome,categoria,cidade_estado,foto_capa_path')
    .eq('ativo', true)
    .eq('categoria', data.categoria)
    .neq('id', data.id)
    .order('ordem', { ascending: true })
    .limit(3);

  render(data, related || []);
}

load();
