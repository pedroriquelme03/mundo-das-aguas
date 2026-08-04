// Bio / Linktree — public.bio_links
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const list = document.getElementById('bioLinks');

const FALLBACK = [
  { titulo: 'WhatsApp Comercial', url: 'https://wa.me/5545999677835?text=Olá! Vim pelo Instagram e gostaria de informações.', estilo: 'whatsapp', nova_aba: true },
  { titulo: 'Site oficial', url: '/', estilo: 'padrao', nova_aba: false },
  { titulo: 'Nossa Frota', url: '/pages/frota.html', estilo: 'padrao', nova_aba: false },
  { titulo: 'Excursões de Compras', url: '/pages/servicos.html#compras', estilo: 'padrao', nova_aba: false },
  { titulo: 'Pacotes Turísticos', url: '/pages/servicos.html#pacotes', estilo: 'padrao', nova_aba: false },
  { titulo: 'Reservas (hotéis, aéreos, cruzeiros)', url: '/pages/reservas.html', estilo: 'padrao', nova_aba: false },
  { titulo: 'Contato / Orçamento', url: '/pages/contato.html', estilo: 'padrao', nova_aba: false },
  { titulo: 'Blog', url: '/pages/blog.html', estilo: 'padrao', nova_aba: false },
  { titulo: 'Emergencial 24h', url: 'https://wa.me/5545999648080?text=Olá! Preciso de suporte durante a viagem.', estilo: 'whatsapp', nova_aba: true }
];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
    list.innerHTML = '<p class="linktree__loading">Nenhum link disponível no momento.</p>';
    return;
  }
  list.innerHTML = rows.map((r) => {
    const cls = r.estilo === 'whatsapp' ? 'linktree__btn linktree__btn--wa' : 'linktree__btn';
    const target = r.nova_aba !== false ? ' target="_blank" rel="noopener"' : '';
    return `<a class="${cls}" href="${esc(resolveUrl(r.url))}"${target}>${esc(r.titulo)}</a>`;
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
