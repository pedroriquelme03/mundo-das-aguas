// Catálogo dinâmico da Frota — lê tabela public.frota
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const mount = document.getElementById('frotaCatalog');
const WA = '5545999677835';

const SEAL = {
 leito: { label: 'Leito Cama', className: 'fleet-seal--leito' },
 semi: { label: 'Semi-Leito', className: 'fleet-seal--semi' },
 executivo: { label: 'Executivo', className: 'fleet-seal--exec' }
};

const FEATURE_META = [
 { key: 'banheiro', label: 'Banheiro', svg: '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h10"/><circle cx="18" cy="18" r="2"/>' },
 { key: 'ar', label: 'Ar', svg: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>' },
 { key: 'usb', label: 'USB', svg: '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' },
 { key: 'midia', label: 'Multimídia', svg: '<rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>' },
 { key: 'bagageiro', label: 'Bagageiro', svg: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>' },
 { key: 'starlink', label: 'Starlink', svg: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>' }
];

const PEOPLE_SVG = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
 ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('../')) return path;
  if (path.startsWith('/img/')) return '..' + path;
  if (path.startsWith('img/')) return '../' + path;
  return `${cfg.url}/storage/v1/object/public/${cfg.bucket || 'excursoes'}/${path}`;
}

function icon(svg) {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svg}</svg>`;
}

function featuresHtml(v) {
  const f = v.features || {};
  const items = [];
  if (v.lugares) {
 items.push(`<li title="Lugares">${icon(PEOPLE_SVG)} ${esc(v.lugares)}</li>`);
 }
 FEATURE_META.forEach((m) => {
    if (f[m.key]) items.push(`<li title="${esc(m.label)}">${icon(m.svg)} ${esc(m.label)}</li>`);
 });
  return items.length ? `<ul class="fleet-row__features" aria-label="Características">${items.join('')}</ul>` : '';
}

function galleryHtml(v) {
  const paths = (v.galeria || []).map(fotoUrl).filter(Boolean);
  const slides = paths.length
 ? paths.map((src, i) => `
 <figure class="fleet-row__slide">
 <img src="${esc(src)}" alt="${esc(v.nome)}, foto ${i + 1}" loading="lazy">
 </figure>`).join('')
 : `<figure class="fleet-row__slide"><div class="img-placeholder" style="min-height:240px">Sem foto</div></figure>`;

  return `
 <div class="fleet-row__gallery" data-fleet-gallery>
 <div class="fleet-row__viewport">
 <div class="fleet-row__track">${slides}</div>
 </div>
 <button type="button" class="fleet-row__arrow fleet-row__arrow--prev" aria-label="Foto anterior">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
 </button>
 <button type="button" class="fleet-row__arrow fleet-row__arrow--next" aria-label="Próxima foto">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
 </button>
 <div class="fleet-row__dots" role="tablist" aria-label="Fotos do veículo"></div>
 </div>`;
}

function rowHtml(v) {
  const seal = SEAL[v.categoria] || { label: v.categoria, className: '' };
  const msg = `Olá! Gostaria de solicitar orçamento para o ${v.nome} (${seal.label}).`;
  return `
 <article class="fleet-row" data-category="${esc(v.categoria)}">
 ${galleryHtml(v)}
 <div class="fleet-row__info">
 <div class="fleet-row__head">
 <div>
 <h3 class="fleet-row__name">${esc(v.nome)}</h3>
 ${v.modelo ? `<p class="fleet-row__model">${esc(v.modelo)}</p>` : ''}
 </div>
 <span class="fleet-seal ${seal.className}">${esc(seal.label)}</span>
 </div>
 ${featuresHtml(v)}
 ${v.descricao ? `<p class="fleet-row__desc">${esc(v.descricao)}</p>` : ''}
 <a href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" class="btn btn--whatsapp" target="_blank" rel="noopener">
 Solicitar orçamento pelo WhatsApp
 </a>
 </div>
 </article>`;
}

function initFleetGalleries(scope) {
 (scope || document).querySelectorAll('[data-fleet-gallery]').forEach((gallery) => {
    if (gallery.dataset.ready) return;
 gallery.dataset.ready = '1';
    const track = gallery.querySelector('.fleet-row__track');
    const slides = gallery.querySelectorAll('.fleet-row__slide');
    const prev = gallery.querySelector('.fleet-row__arrow--prev');
    const next = gallery.querySelector('.fleet-row__arrow--next');
    const dotsBox = gallery.querySelector('.fleet-row__dots');
    if (!track || !slides.length) return;

    let index = 0;
    const total = slides.length;

    function goTo(i) {
 index = (i + total) % total;
 track.style.transform = `translateX(-${index * 100}%)`;
      if (dotsBox) {
 dotsBox.querySelectorAll('button').forEach((d, di) => d.classList.toggle('active', di === index));
 }
 }

    if (dotsBox) {
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
 dot.type = 'button';
 dot.setAttribute('aria-label', `Foto ${i + 1}`);
        if (i === 0) dot.className = 'active';
        const n = i;
 dot.addEventListener('click', () => goTo(n));
 dotsBox.appendChild(dot);
 }
 }

    if (prev) prev.addEventListener('click', () => goTo(index - 1));
    if (next) next.addEventListener('click', () => goTo(index + 1));

    let startX = 0;
 gallery.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
 gallery.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) < 40) return;
 goTo(index + (dx < 0 ? 1 : -1));
 }, { passive: true });
 });
}

async function load() {
  if (!mount) return;
  if (!cfg.url || !cfg.anonKey) {
 mount.innerHTML = `<p class="muted">Configuração Supabase ausente.</p>`;
 return;
 }

 mount.innerHTML = `<p class="muted">Carregando frota…</p>`;
  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await supabase
 .from('frota')
 .select('*')
 .eq('ativo', true)
 .order('ordem', { ascending: true });

  if (error) {
 mount.innerHTML = `<p class="muted">Não foi possível carregar a frota. Tente novamente mais tarde.</p>`;
 console.error(error);
 return;
 }

  if (!data || !data.length) {
 mount.innerHTML = `<p class="muted">Nenhum veículo disponível no momento. Fale conosco pelo WhatsApp para montar o fretamento ideal.</p>`;
 return;
 }

 mount.innerHTML = data.map(rowHtml).join('');
 initFleetGalleries(mount);
}

load();
