// Pacotes Turísticos (Seção 6 da Home) — lê de public.excursoes com destaque_home.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderDestinosSlider } from './destinos-slider.js';

const cfg = window.MDA_SUPABASE || {};
const grid = document.getElementById('pacotesTuristicosGrid');
if (!grid || !cfg.url || !cfg.anonKey) {
  // página sem o container
} else {
  const supabase = createClient(cfg.url, cfg.anonKey);
  const limit = parseInt(grid.dataset.limit || '12', 10);
  const WA = (window.MDA_CONTACT && window.MDA_CONTACT.whatsapp_comercial) || '5545999677835';

  const CAT = {
 compras: 'Compras',
 romaria: 'Romaria',
 pescaria: 'Pescaria',
 nacional: 'Turismo',
 internacional: 'Internacional',
 pacote: 'Pacote'
 };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
 ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtDate(d) {
    if (!d) return 'a definir';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
 }

  function fotoUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
 }

  function cardHtml(ex) {
    const foto = fotoUrl(ex.foto_capa_path);
    const media = foto
 ? `<img src="${esc(foto)}" alt="${esc(ex.nome)}" loading="lazy">`
 : `<div class="img-placeholder"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Foto do destino</div>`;
    const faixa = ex.faixa_destaque ? `<span class="destino-card__faixa">${esc(ex.faixa_destaque)}</span>` : '';
    const href = `/excursao?slug=${encodeURIComponent(ex.slug)}`;
    const wa = ex.link_reserva || `https://wa.me/${WA}?text=${encodeURIComponent('Olá! Gostaria de informações sobre: ' + ex.nome)}`;

    return `
 <article class="destino-card">
 <div class="destino-card__media">
 ${faixa}
 <span class="destino-card__cat">${esc(CAT[ex.categoria] || ex.categoria)}</span>
 ${media}
 </div>
 <div class="destino-card__body">
 <h3 class="destino-card__title">${esc(ex.nome)}</h3>
 <p class="destino-card__local">${esc(ex.cidade_estado || '')}</p>
 <div class="destino-card__meta">
 <span class="destino-card__meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><strong>Saída:</strong> ${fmtDate(ex.data_saida)}</span>
 <span class="destino-card__meta-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg><strong>Retorno:</strong> ${fmtDate(ex.data_retorno)}</span>
 </div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto">
 <a href="${esc(href)}" class="btn btn--outline">Saiba mais</a>
 <a href="${esc(wa)}" class="btn btn--primary" target="_blank" rel="noopener">Reservar</a>
 </div>
 </div>
 </article>`;
 }

 async function load() {
 try {
      const { data, error } = await supabase
 .from('excursoes')
 .select('*')
 .eq('ativo', true)
 .eq('destaque_home', true)
 .neq('categoria', 'compras')
 .order('ordem', { ascending: true })
 .order('data_saida', { ascending: true })
 .limit(limit);

      if (error) throw error;

      if (!data || data.length === 0) {
 grid.innerHTML = '<div class="destinos__empty">Em breve novos pacotes turísticos. Fale conosco no WhatsApp para consultar as próximas saídas.</div>';
 return;
 }
 renderDestinosSlider(grid, data.map(cardHtml).join(''));
 } catch (err) {
 grid.innerHTML = `<div class="destinos__empty">Não foi possível carregar os pacotes. ${esc(err.message)}</div>`;
 }
 }

 load();
}
