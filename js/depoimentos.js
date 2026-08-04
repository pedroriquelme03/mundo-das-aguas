// Depoimentos (Seção 8 da Home) — lê de public.depoimentos.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const track = document.getElementById('testimonialsTrack');
if (track && cfg.url && cfg.anonKey) {
  const supabase = createClient(cfg.url, cfg.anonKey);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function stars(n) {
    const count = Math.min(5, Math.max(1, Number(n) || 5));
    return '&#9733;'.repeat(count);
  }

  function cardHtml(d) {
    return `
      <div class="testimonial-card">
        <div class="testimonial-card__stars">${stars(d.estrelas)}</div>
        <p>"${esc(d.texto)}"</p>
        <div class="testimonial-card__author">
          <strong>${esc(d.nome)}</strong>
          ${d.contexto ? `<span>${esc(d.contexto)}</span>` : ''}
        </div>
      </div>`;
  }

  async function load() {
    try {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      if (!data || !data.length) return; // mantém fallback estático do HTML

      track.innerHTML = data.map(cardHtml).join('');
      // reinicia dots/slider se main.js já tiver rodado — dispara resize
      window.dispatchEvent(new Event('resize'));
    } catch (_) {
      // silencioso: mantém cards estáticos
    }
  }

  load();
}
