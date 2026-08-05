// Imagens institucionais — public.site_media
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function resolveUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return path;
  if (path.startsWith('images/') || path.startsWith('img/')) return '/' + path;
  const base = (cfg.url || '').replace(/\/$/, '');
  const bucket = cfg.bucket || 'excursoes';
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function applyImg(el, item) {
  const url = resolveUrl(item.image_path);
  if (!url) return;
  if (el.getAttribute('src') !== url) el.setAttribute('src', url);
  if (item.alt_text) el.setAttribute('alt', item.alt_text);
}

function applyGroup(container, items) {
  if (!items.length) return;
  container.innerHTML = items.map((item) => {
    const url = resolveUrl(item.image_path);
    if (!url) return '';
    const cap = item.caption
      ? `<figcaption>${esc(item.caption)}</figcaption>`
      : '';
    return `<figure><img src="${esc(url)}" alt="${esc(item.alt_text || item.titulo)}" loading="lazy">${cap}</figure>`;
  }).join('');
}

async function load() {
  if (!cfg.url || !cfg.anonKey) return;

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data, error } = await supabase
    .from('site_media')
    .select('chave, grupo, titulo, image_path, alt_text, caption, ordem')
    .order('ordem', { ascending: true });

  if (error || !data) {
    console.warn('[site-media]', error?.message || 'sem dados');
    return;
  }

  const byKey = {};
  const byGroup = {};
  data.forEach((row) => {
    const item = {
      ...row,
      url: resolveUrl(row.image_path)
    };
    byKey[row.chave] = item;
    if (!byGroup[row.grupo]) byGroup[row.grupo] = [];
    byGroup[row.grupo].push(item);
  });

  window.MDA_SITE_MEDIA = byKey;
  window.dispatchEvent(new CustomEvent('mda:media-ready', { detail: byKey }));

  document.querySelectorAll('[data-mda-media]').forEach((el) => {
    const key = el.getAttribute('data-mda-media');
    const item = key && byKey[key];
    if (!item) return;
    if (el.tagName === 'IMG') applyImg(el, item);
  });

  document.querySelectorAll('[data-mda-media-group]').forEach((el) => {
    const grupo = el.getAttribute('data-mda-media-group');
    if (!grupo || !byGroup[grupo]) return;
    applyGroup(el, byGroup[grupo]);
  });
}

load();
