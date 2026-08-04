import { supabase } from './supabase';
import {
  listExcursoes, createExcursao, updateExcursao, deleteExcursao,
  uploadFoto, removeFoto, fotoPublicUrl
} from './api';
import type { ExcursaoCompras, ExcursaoInput } from './types';

const app = document.getElementById('app')!;

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};

/* ---------------- LOGIN ---------------- */
function renderLogin(errorMsg = '') {
  app.innerHTML = `
    <div class="auth">
      <form class="card auth__card" id="loginForm">
        <h1>Painel Administrativo</h1>
        <p class="muted">Mundo das Águas · Excursões de Compras</p>
        <label>E-mail<input type="email" name="email" required autocomplete="username"></label>
        <label>Senha<input type="password" name="password" required autocomplete="current-password"></label>
        ${errorMsg ? `<p class="error">${esc(errorMsg)}</p>` : ''}
        <button type="submit" class="btn btn--primary">Entrar</button>
      </form>
    </div>`;

  const form = document.getElementById('loginForm') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button')!;
    btn.disabled = true; btn.textContent = 'Entrando…';
    const fd = new FormData(form);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get('email')),
      password: String(fd.get('password'))
    });
    if (error) {
      renderLogin(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha inválidos.' : error.message);
    }
    // onAuthStateChange cuida de renderizar o dashboard em caso de sucesso
  });
}

/* ---------------- DASHBOARD ---------------- */
async function renderDashboard() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <strong>Mundo das Águas</strong>
        <span class="muted"> · Painel Administrativo</span>
      </div>
      <button class="btn btn--ghost" id="logoutBtn">Sair</button>
    </header>
    <main class="wrap">
      <div class="section-head">
        <h2>Excursões de Compras</h2>
        <button class="btn btn--primary" id="newBtn">+ Nova excursão</button>
      </div>
      <div id="list"><p class="muted">Carregando…</p></div>
    </main>
    <div id="modalRoot"></div>`;

  document.getElementById('logoutBtn')!.addEventListener('click', () => supabase.auth.signOut());
  document.getElementById('newBtn')!.addEventListener('click', () => openForm());

  await refreshList();
}

async function refreshList() {
  const list = document.getElementById('list')!;
  try {
    const rows = await listExcursoes();
    if (rows.length === 0) {
      list.innerHTML = `<div class="card empty">Nenhuma excursão cadastrada ainda. Clique em <b>+ Nova excursão</b>.</div>`;
      return;
    }
    list.innerHTML = `
      <table class="table">
        <thead><tr>
          <th></th><th>Destino</th><th>Cidade/Estado</th><th>Saída</th><th>Retorno</th>
          <th>Embarque</th><th>Faixa</th><th>Ordem</th><th>Ativo</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.map(rowHtml).join('')}
        </tbody>
      </table>`;
    list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const row = rows.find((r) => r.id === b.dataset.edit);
        if (row) openForm(row);
      }));
    list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const row = rows.find((r) => r.id === b.dataset.del);
        if (row) confirmDelete(row);
      }));
  } catch (err) {
    list.innerHTML = `<div class="card error">Erro ao carregar: ${esc((err as Error).message)}</div>`;
  }
}

function rowHtml(r: ExcursaoCompras): string {
  const url = fotoPublicUrl(r.foto_path);
  const thumb = url
    ? `<img class="thumb" src="${esc(url)}" alt="">`
    : `<span class="thumb thumb--empty">sem foto</span>`;
  return `<tr>
    <td>${thumb}</td>
    <td><b>${esc(r.destino)}</b></td>
    <td>${esc(r.cidade_estado || '—')}</td>
    <td>${fmtDate(r.data_saida)}</td>
    <td>${fmtDate(r.data_retorno)}</td>
    <td>${esc(r.cidade_embarque || '—')}</td>
    <td>${r.faixa_destaque ? `<span class="pill">${esc(r.faixa_destaque)}</span>` : '—'}</td>
    <td>${r.ordem}</td>
    <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
    <td class="actions">
      <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
      <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
    </td>
  </tr>`;
}

/* ---------------- FORMULÁRIO (modal) ---------------- */
function openForm(row?: ExcursaoCompras) {
  const isEdit = !!row;
  const modalRoot = document.getElementById('modalRoot')!;
  const currentUrl = fotoPublicUrl(row?.foto_path);
  modalRoot.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal" id="exForm">
        <h3>${isEdit ? 'Editar excursão' : 'Nova excursão'}</h3>
        <div class="grid2">
          <label>Destino *<input name="destino" required value="${esc(row?.destino || '')}"></label>
          <label>Cidade / Estado<input name="cidade_estado" value="${esc(row?.cidade_estado || '')}" placeholder="São Paulo – SP"></label>
          <label>Cidade de embarque<input name="cidade_embarque" value="${esc(row?.cidade_embarque || '')}" placeholder="Foz do Iguaçu – PR"></label>
          <label>Faixa de destaque (opcional)<input name="faixa_destaque" value="${esc(row?.faixa_destaque || '')}" placeholder="Próxima saída"></label>
          <label>Data de saída<input type="date" name="data_saida" value="${esc(row?.data_saida || '')}"></label>
          <label>Data de retorno<input type="date" name="data_retorno" value="${esc(row?.data_retorno || '')}"></label>
          <label>Link do botão (opcional)<input name="link" value="${esc(row?.link || '')}" placeholder="https://wa.me/55..."></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo (exibir na Home)</label>
        <label>Foto do destino
          <input type="file" name="foto" accept="image/*">
        </label>
        ${currentUrl ? `<div class="preview"><img src="${esc(currentUrl)}" alt=""><span class="muted">Foto atual (envie outra para substituir)</span></div>` : ''}
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">${isEdit ? 'Salvar alterações' : 'Cadastrar'}</button>
        </div>
      </form>
    </div>`;

  const overlay = document.getElementById('overlay')!;
  const form = document.getElementById('exForm') as HTMLFormElement;
  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('cancelBtn')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true;
    saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const fd = new FormData(form);
      const file = fd.get('foto') as File | null;

      let foto_path = row?.foto_path ?? null;
      if (file && file.size > 0) {
        const newPath = await uploadFoto(file);
        if (isEdit && row?.foto_path) await removeFoto(row.foto_path);
        foto_path = newPath;
      }

      const input: ExcursaoInput = {
        destino: String(fd.get('destino')).trim(),
        cidade_estado: strOrNull(fd.get('cidade_estado')),
        cidade_embarque: strOrNull(fd.get('cidade_embarque')),
        data_saida: strOrNull(fd.get('data_saida')),
        data_retorno: strOrNull(fd.get('data_retorno')),
        faixa_destaque: strOrNull(fd.get('faixa_destaque')),
        link: strOrNull(fd.get('link')),
        ordem: Number(fd.get('ordem') || 0),
        ativo: fd.get('ativo') === 'on',
        foto_path
      };

      if (isEdit && row) await updateExcursao(row.id, input);
      else await createExcursao(input);

      close();
      await refreshList();
    } catch (err) {
      errEl.textContent = 'Erro ao salvar: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = isEdit ? 'Salvar alterações' : 'Cadastrar';
    }
  });
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

function confirmDelete(row: ExcursaoCompras) {
  const modalRoot = document.getElementById('modalRoot')!;
  modalRoot.innerHTML = `
    <div class="overlay" id="overlay">
      <div class="card modal modal--sm">
        <h3>Excluir excursão</h3>
        <p>Tem certeza que deseja excluir <b>${esc(row.destino)}</b>? Esta ação não pode ser desfeita.</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button class="btn btn--danger" id="okBtn">Excluir</button>
        </div>
      </div>
    </div>`;
  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('cancelBtn')!.addEventListener('click', close);
  document.getElementById('okBtn')!.addEventListener('click', async () => {
    const btn = document.getElementById('okBtn') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Excluindo…';
    try {
      await deleteExcursao(row.id);
      await removeFoto(row.foto_path);
      close();
      await refreshList();
    } catch (err) {
      alert('Erro ao excluir: ' + (err as Error).message);
      close();
    }
  });
}

/* ---------------- BOOTSTRAP (auth gate) ---------------- */
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) renderDashboard();
  else renderLogin();
});

(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) renderDashboard();
  else renderLogin();
})();
