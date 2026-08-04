// Contato do site — public.site_contact
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FALLBACK = {
  empresa: 'Mundo das Águas Turismo',
  email: 'atendimento@mundodasaguas.com.br',
  telefone_agencia: '(45) 3523-3060',
  whatsapp_comercial: '5545999677835',
  whatsapp_comercial_label: '(45) 99967-7835',
  whatsapp_emergencial: '5545999648080',
  whatsapp_emergencial_label: '(45) 99964-8080',
  endereco_linha1: 'Av. Safira, 1375 — Parque Patriarca',
  endereco_linha2: '',
  cidade: 'Foz do Iguaçu',
  estado: 'PR',
  cep: '85854-000',
  mapa_url: 'https://share.google/9oMqpcefoCuCh2cz4',
  horario_atendimento: 'Segunda a Sexta, das 08h às 18h | Sábado, das 08h às 12h',
  mensagem_wa_comercial: 'Olá! Gostaria de informações.',
  mensagem_wa_emergencial: 'Olá! Preciso de suporte durante a viagem.'
};

const OLD_COMERCIAL = '5545999677835';
const OLD_EMERGENCIAL = '5545999648080';
const OLD_EMAIL = 'atendimento@mundodasaguas.com.br';
const OLD_TEL_DIGITS = '554535233060';

const cfg = window.MDA_SUPABASE || {};
const digits = (s) => String(s || '').replace(/\D/g, '');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function waUrl(number, text) {
  const n = digits(number);
  if (!n) return '#';
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function telUrl(display) {
  const d = digits(display);
  if (!d) return '#';
  return d.startsWith('55') ? `tel:+${d}` : `tel:+55${d}`;
}

function applyContact(c) {
  const comercial = digits(c.whatsapp_comercial) || OLD_COMERCIAL;
  const emergencial = digits(c.whatsapp_emergencial) || OLD_EMERGENCIAL;
  const email = c.email || OLD_EMAIL;
  const telDisplay = c.telefone_agencia || FALLBACK.telefone_agencia;
  const telDig = digits(telDisplay) || OLD_TEL_DIGITS;

  document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (a.classList.contains('whatsapp-float') || href.includes(OLD_EMERGENCIAL) || href.includes(emergencial)) {
      const u = new URL(href, location.origin);
      const text = u.searchParams.get('text') || c.mensagem_wa_emergencial;
      a.setAttribute('href', waUrl(emergencial, text));
      return;
    }
    if (href.includes(OLD_COMERCIAL) || href.includes(comercial) || a.classList.contains('header__cta') || a.classList.contains('mobile-nav__wa')) {
      const u = new URL(href, location.origin);
      const text = u.searchParams.get('text') || c.mensagem_wa_comercial;
      a.setAttribute('href', waUrl(comercial, text));
    }
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.includes(OLD_EMAIL) || a.dataset.mda === 'email') {
      a.setAttribute('href', `mailto:${email}`);
      if (a.textContent && a.textContent.includes('@')) a.textContent = email;
    }
  });

  document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.includes(OLD_TEL_DIGITS) || href.includes(telDig) || a.dataset.mda === 'tel-agencia') {
      a.setAttribute('href', telUrl(telDisplay));
      if (/\d/.test(a.textContent || '')) a.textContent = telDisplay;
    }
  });

  // Rodapé — bloco Contato
  document.querySelectorAll('[data-mda-block="phones"], .footer__contact').forEach((block) => {
    const h4 = block.querySelector('h4');
    if (!h4) return;
    const title = (h4.textContent || '').trim().toLowerCase();
    if (block.getAttribute('data-mda-block') === 'phones' || title === 'contato') {
      block.setAttribute('data-mda-block', 'phones');
      block.innerHTML = `
        <h4>Contato</h4>
        <p><strong>WhatsApp Comercial</strong><br>${esc(c.whatsapp_comercial_label)}</p>
        <p><strong>Emergencial 24h</strong><br>${esc(c.whatsapp_emergencial_label)}</p>
        <p><strong>Agência</strong><br>${esc(telDisplay)}</p>
        <p>${esc(email)}</p>`;
    } else if (block.getAttribute('data-mda-block') === 'address' || title === 'endereço' || title === 'endereco') {
      block.setAttribute('data-mda-block', 'address');
      const mapa = c.mapa_url
        ? `<a href="${esc(c.mapa_url)}" class="btn btn--outline btn--sm" target="_blank" rel="noopener" style="margin-top:8px;">Como chegar</a>`
        : '';
      const linha2 = c.endereco_linha2 ? `<br>${esc(c.endereco_linha2)}` : '';
      const cep = c.cep ? `<br>CEP ${esc(c.cep)}` : '';
      block.innerHTML = `
        <h4>Endereço</h4>
        <p>${esc(c.empresa)}<br>${esc(c.endereco_linha1)}${linha2}<br>${esc(c.cidade)} – ${esc(c.estado)}${cep}</p>
        ${mapa}`;
    }
  });

  // Página Contato — cards laterais
  document.querySelectorAll('[data-mda-field]').forEach((el) => {
    const field = el.getAttribute('data-mda-field');
    if (!field) return;
    if (field === 'whatsapp_comercial_label') {
      el.textContent = c.whatsapp_comercial_label;
      el.setAttribute('href', waUrl(comercial));
    } else if (field === 'whatsapp_emergencial_label') {
      el.textContent = c.whatsapp_emergencial_label;
      el.setAttribute('href', waUrl(emergencial));
    } else if (field === 'telefone_agencia') {
      el.textContent = telDisplay;
      el.setAttribute('href', telUrl(telDisplay));
    } else if (field === 'email') {
      el.textContent = email;
      el.setAttribute('href', `mailto:${email}`);
    } else if (field === 'horario_atendimento') {
      el.innerHTML = esc(c.horario_atendimento).replace(/\n/g, '<br>').replace(/\s*\|\s*/g, '<br>');
    } else if (field === 'endereco') {
      const linha2 = c.endereco_linha2 ? `<br>${esc(c.endereco_linha2)}` : '';
      const cep = c.cep ? ` · CEP ${esc(c.cep)}` : '';
      el.innerHTML = `${esc(c.endereco_linha1)}${linha2}<br>${esc(c.cidade)} – ${esc(c.estado)}${cep}`;
    } else if (field === 'mapa_url' && c.mapa_url) {
      el.setAttribute('href', c.mapa_url);
    } else if (Object.prototype.hasOwnProperty.call(c, field) && c[field] != null) {
      el.textContent = c[field];
    }
  });

  window.MDA_CONTACT = c;
}

async function loadContact() {
  if (!cfg.url || !cfg.anonKey) {
    applyContact(FALLBACK);
    return;
  }
  try {
    const supabase = createClient(cfg.url, cfg.anonKey);
    const { data, error } = await supabase
      .from('site_contact')
      .select('*')
      .eq('id', 'general')
      .maybeSingle();
    if (error) throw error;
    applyContact({ ...FALLBACK, ...(data || {}) });
  } catch (err) {
    console.warn('[site-contact]', err);
    applyContact(FALLBACK);
  }
}

loadContact();
