// Bio / Linktree — public.bio_links
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const list = document.getElementById('bioLinks');

const FALLBACK = [
 { titulo: 'WhatsApp Comercial', url: 'https://wa.me/5545999677835?text=Olá! Vim pelo Instagram e gostaria de informações.', estilo: 'whatsapp', nova_aba: true },
 { titulo: 'Site oficial', url: '/', estilo: 'padrao', nova_aba: false },
 { titulo: 'Nossa Frota', url: '/frota', estilo: 'padrao', nova_aba: false },
 { titulo: 'Excursões de Compras', url: '/servicos#compras', estilo: 'padrao', nova_aba: false },
 { titulo: 'Pacotes Turísticos', url: '/servicos#pacotes', estilo: 'padrao', nova_aba: false },
 { titulo: 'Reservas (hotéis, aéreos, cruzeiros)', url: '/reservas', estilo: 'padrao', nova_aba: false },
 { titulo: 'Contato / Orçamento', url: '/contato', estilo: 'padrao', nova_aba: false },
 { titulo: 'Blog', url: '/blog', estilo: 'padrao', nova_aba: false },
 { titulo: 'Emergencial 24h', url: 'https://wa.me/5545999648080?text=Olá! Preciso de suporte durante a viagem.', estilo: 'whatsapp', nova_aba: true }
];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
 ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const S = (p, fill) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${p}</svg>`;
const ICONS = {
 whatsapp: S('<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M20.52 3.449A11.815 11.815 0 0012.05.001C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413zM12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z"/>', true),
 emergencia: S('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
 site: S('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
 frota: S('<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
 compras: S('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
 pacotes: S('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
 reservas: S('<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="19"/>'),
 contato: S('<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
 blog: S('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="18" y1="14" x2="12" y2="14"/><line x1="18" y1="18" x2="12" y2="18"/><line x1="12" y1="6" x2="18" y2="6"/>'),
 instagram: S('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'),
 link: S('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')
};
const CHEV = S('<polyline points="9 18 15 12 9 6"/>');

function iconFor(r) {
  const t = (r.titulo || '').toLowerCase();
  const u = (r.url || '').toLowerCase();
  if (r.estilo === 'whatsapp' && /emerg|24/.test(t)) return ICONS.emergencia;
  if (r.estilo === 'whatsapp' || /whats/.test(t)) return ICONS.whatsapp;
  if (/instagram|insta/.test(t) || /instagram\.com/.test(u)) return ICONS.instagram;
  if (/frota|ônibus|onibus/.test(t)) return ICONS.frota;
  if (/compra/.test(t)) return ICONS.compras;
  if (/pacote|turís|turis|excurs/.test(t)) return ICONS.pacotes;
  if (/reserva/.test(t)) return ICONS.reservas;
  if (/contato|orçam|orcam/.test(t)) return ICONS.contato;
  if (/blog/.test(t)) return ICONS.blog;
  if (/site|home|oficial/.test(t) || u === '/') return ICONS.site;
  return ICONS.link;
}

function resolveUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '#';
  if (/^https?:\/\//i.test(u) || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('wa.me')) return u;
  if (u.startsWith('/')) return u;
  return '/' + u.replace(/^\.\//, '');
}

function render(rows) {
  if (!list) return;
  if (!rows.length) {
 list.innerHTML = '<p class="bio-links__loading">Nenhum link disponível no momento.</p>';
 return;
 }
 list.innerHTML = rows.map((r, i) => {
    const t = (r.titulo || '').toLowerCase();
    const isEmg = r.estilo === 'whatsapp' && /emerg|24/.test(t);
    let cls = 'bio-link';
    if (isEmg) cls += ' bio-link--emg';
 else if (r.estilo === 'whatsapp') cls += ' bio-link--wa';
    const target = r.nova_aba !== false ? ' target="_blank" rel="noopener"' : '';
    return `<a class="${cls}" style="--i:${i}" href="${esc(resolveUrl(r.url))}"${target}>` +
 `<span class="bio-link__ico">${iconFor(r)}</span>` +
 `<span class="bio-link__label">${esc(r.titulo)}</span>` +
 `<span class="bio-link__chev">${CHEV}</span>` +
 `</a>`;
 }).join('');
}

async function load() {
  if (!list) return;
  if (!cfg.url || !cfg.anonKey) {
 render(FALLBACK);
 return;
 }
 try {
    const supabase = createClient(cfg.url, cfg.anonKey);
    const { data, error } = await supabase
 .from('bio_links')
 .select('titulo, url, estilo, nova_aba, ordem')
 .eq('ativo', true)
 .order('ordem', { ascending: true })
 .order('titulo', { ascending: true });
    if (error) throw error;
 render(data && data.length ? data : FALLBACK);
 } catch (err) {
 console.warn('[bio]', err);
 render(FALLBACK);
 }
}

load();
