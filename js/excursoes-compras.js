// Excursões de Compras (Seção 4 da Home) — renderização dinâmica a partir do Supabase.
// Os cards são cadastrados/editados no painel administrativo (admin/).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderDestinosSlider } from './destinos-slider.js';

const cfg = window.MDA_SUPABASE || {};
const grid = document.getElementById('excursoesComprasGrid');

if (grid && cfg.url && cfg.anonKey) {
  const supabase = createClient(cfg.url, cfg.anonKey);
  const limit = parseInt(grid.dataset.limit || '12', 10);

  const WA_COMERCIAL = (window.MDA_CONTACT && window.MDA_CONTACT.whatsapp_comercial) || '5545999677835';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function fmtDate(d) {
    if (!d) return 'a definir';
    const parts = String(d).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  }

  function fotoUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const bucket = cfg.bucket || 'excursoes';
    return `${cfg.url}/storage/v1/object/public/${bucket}/${path}`;
  }

  function waLink(ex) {
    if (ex.link) return ex.link;
    const msg = `Olá! Quero informações sobre a excursão de compras para ${ex.destino}.`;
    return `https://wa.me/${WA_COMERCIAL}?text=${encodeURIComponent(msg)}`;
  }

  function cardHtml(ex) {
    const foto = fotoUrl(ex.foto_path);
    const media = foto
      ? `<img src="${esc(foto)}" alt="${esc(ex.destino)}" loading="lazy">`
      : `<div class="img-placeholder"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Foto do destino</div>`;
    const faixa = ex.faixa_destaque ? `<span class="destino-card__faixa">${esc(ex.faixa_destaque)}</span>` : '';

    return `
      <article class="destino-card">
        <div class="destino-card__media">
          ${faixa}
          <span class="destino-card__cat">Compras</span>
          ${media}
        </div>
        <div class="destino-card__body">
          <h3 class="destino-card__title">${esc(ex.destino)}</h3>
          <p class="destino-card__local">${esc(ex.cidade_estado || '')}</p>
          <div class="destino-card__meta">
            <span class="destino-card__meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> <strong>Saída:</strong> ${fmtDate(ex.data_saida)}</span>
            <span class="destino-card__meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> <strong>Retorno:</strong> ${fmtDate(ex.data_retorno)}</span>
            ${ex.cidade_embarque ? `<span class="destino-card__meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <strong>Embarque:</strong> ${esc(ex.cidade_embarque)}</span>` : ''}
          </div>
          <a href="${esc(waLink(ex))}" class="btn btn--primary" target="_blank" rel="noopener">Reservar minha vaga</a>
        </div>
      </article>`;
  }

  async function load() {
    try {
      const { data, error } = await supabase
        .from('excursoes_compras')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('data_saida', { ascending: true })
        .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
        grid.innerHTML = '<div class="destinos__empty">Em breve novas excursões de compras. Fale com a gente no WhatsApp para consultar as próximas saídas.</div>';
        return;
      }
      renderDestinosSlider(grid, data.map(cardHtml).join(''));
    } catch (err) {
      console.error('[excursoes-compras] Falha ao carregar:', err);
      grid.innerHTML = '<div class="destinos__empty">Não foi possível carregar as excursões agora. Fale com a gente no WhatsApp para consultar as próximas saídas.</div>';
    }
  }

  load();
}
