// Formulários da página Contato — grava em contato_leads (+ Storage para currículo).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MDA_SUPABASE || {};
const WA = '5545999677835';
const MIN_FILL_MS = 2500;
const COOLDOWN_KEY = 'mda_contact_last';
const COOLDOWN_MS = 60_000;

const TYPE_LABEL = {
  fretamento: 'Fretamento',
  excursoes: 'Excursões e Pacotes',
  encomendas: 'Encomendas',
  trabalhe: 'Trabalhe Conosco'
};

const supabase = (cfg.url && cfg.anonKey)
  ? createClient(cfg.url, cfg.anonKey)
  : null;

/* ---- Tabs / deep-link ---- */
const typeBtns = document.querySelectorAll('.contact-type');
const forms = document.querySelectorAll('.contact-form');

function showForm(tipo) {
  typeBtns.forEach((b) => b.classList.toggle('active', b.dataset.form === tipo));
  forms.forEach((f) => f.classList.toggle('active', f.dataset.tipo === tipo));
  const el = document.getElementById('form-' + tipo);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

typeBtns.forEach((btn) => {
  btn.addEventListener('click', () => showForm(btn.dataset.form));
});

const hash = (location.hash || '').replace('#', '');
if (hash.startsWith('form-')) showForm(hash.replace('form-', ''));
else if (['fretamento', 'excursoes', 'encomendas', 'trabalhe'].includes(hash)) showForm(hash);

/* ---- Helpers ---- */
function val(fd, name) {
  return String(fd.get(name) ?? '').trim();
}

function setMsg(form, kind, text) {
  const err = form.querySelector('.contact-form__error');
  const ok = form.querySelector('.contact-form__ok');
  if (err) { err.hidden = kind !== 'error'; err.textContent = kind === 'error' ? text : ''; }
  if (ok) { ok.hidden = kind !== 'ok'; ok.innerHTML = kind === 'ok' ? text : ''; }
}

function phoneOk(tel) {
  const digits = tel.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

function emailOk(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function antiSpam(fd) {
  if (val(fd, 'website')) return 'Spam detectado.';
  const loaded = Number(window.MDA_CONTACT_LOADED_AT || 0);
  if (loaded && Date.now() - loaded < MIN_FILL_MS) return 'Aguarde um instante e envie novamente.';
  const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
  if (last && Date.now() - last < COOLDOWN_MS) return 'Você já enviou uma mensagem há pouco. Aguarde um minuto.';
  return null;
}

function buildCampos(tipo, fd) {
  if (tipo === 'fretamento') {
    return {
      tipo_grupo: val(fd, 'tipo_grupo'),
      destino: val(fd, 'destino'),
      data_viagem: val(fd, 'data_viagem'),
      passageiros: val(fd, 'passageiros')
    };
  }
  if (tipo === 'excursoes') {
    return {
      interesse: val(fd, 'interesse'),
      destino: val(fd, 'destino'),
      embarque: val(fd, 'embarque')
    };
  }
  if (tipo === 'encomendas') {
    return {
      origem: val(fd, 'origem'),
      destino: val(fd, 'destino'),
      volume: val(fd, 'volume')
    };
  }
  if (tipo === 'trabalhe') {
    return { area: val(fd, 'area') };
  }
  return {};
}

function waSummary(tipo, nome, telefone, campos, mensagem) {
  const lines = [
    `*Novo contato — ${TYPE_LABEL[tipo] || tipo}*`,
    `Nome: ${nome}`,
    `Telefone: ${telefone}`
  ];
  Object.entries(campos).forEach(([k, v]) => {
    if (v) lines.push(`${k}: ${v}`);
  });
  if (mensagem) lines.push(`Mensagem: ${mensagem}`);
  return `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
}

async function uploadCurriculo(file) {
  const bucket = cfg.curriculosBucket || 'curriculos';
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safe = file.name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .slice(0, 40);
  const path = `candidaturas/${Date.now()}-${safe || 'curriculo'}.${ext || 'pdf'}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined
  });
  if (error) throw error;
  return path;
}

/* ---- Submit ---- */
forms.forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabase) {
      setMsg(form, 'error', 'Configuração do sistema indisponível. Fale conosco pelo WhatsApp.');
      return;
    }

    const fd = new FormData(form);
    const tipo = form.dataset.tipo;
    const btn = form.querySelector('[type=submit]');
    const spam = antiSpam(fd);
    if (spam) { setMsg(form, 'error', spam); return; }

    const nome = val(fd, 'nome');
    const telefone = val(fd, 'telefone');
    const email = val(fd, 'email');
    const mensagem = val(fd, 'mensagem');

    if (!nome || !telefone) {
      setMsg(form, 'error', 'Preencha nome e telefone.');
      return;
    }
    if (!phoneOk(telefone)) {
      setMsg(form, 'error', 'Informe um telefone válido com DDD.');
      return;
    }
    if (tipo === 'trabalhe' && !email) {
      setMsg(form, 'error', 'E-mail é obrigatório para candidaturas.');
      return;
    }
    if (!emailOk(email)) {
      setMsg(form, 'error', 'E-mail inválido.');
      return;
    }
    if (tipo === 'fretamento' && !val(fd, 'destino')) {
      setMsg(form, 'error', 'Informe o destino do fretamento.');
      return;
    }
    if (tipo === 'encomendas' && (!val(fd, 'origem') || !val(fd, 'destino'))) {
      setMsg(form, 'error', 'Informe origem e destino da encomenda.');
      return;
    }

    let curriculo_path = null;
    if (tipo === 'trabalhe') {
      const file = fd.get('curriculo');
      if (!(file instanceof File) || !file.size) {
        setMsg(form, 'error', 'Anexe o currículo.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMsg(form, 'error', 'O arquivo deve ter no máximo 5 MB.');
        return;
      }
    }

    btn.disabled = true;
    btn.textContent = 'Enviando…';
    setMsg(form, 'error', '');

    try {
      if (tipo === 'trabalhe') {
        const file = fd.get('curriculo');
        curriculo_path = await uploadCurriculo(file);
      }

      const campos = buildCampos(tipo, fd);
      const { error } = await supabase.from('contato_leads').insert({
        tipo,
        nome,
        email: email || null,
        telefone,
        mensagem: mensagem || null,
        campos,
        curriculo_path,
        user_agent: navigator.userAgent.slice(0, 300)
      });
      if (error) throw error;

      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      const wa = waSummary(tipo, nome, telefone, campos, mensagem);
      setMsg(form, 'ok',
        `Recebemos sua mensagem! Nossa equipe vai retornar em breve.<br>
         <a class="btn btn--whatsapp btn--sm" href="${wa}" target="_blank" rel="noopener" style="margin-top:12px">Acompanhar pelo WhatsApp</a>`);
      form.reset();
    } catch (err) {
      setMsg(form, 'error', 'Não foi possível enviar. Tente de novo ou fale no WhatsApp. (' + (err.message || 'erro') + ')');
    } finally {
      btn.disabled = false;
      btn.textContent = form.dataset.tipo === 'encomendas'
        ? 'Solicitar envio'
        : form.dataset.tipo === 'trabalhe'
          ? 'Enviar candidatura'
          : 'Enviar solicitação';
    }
  });
});
