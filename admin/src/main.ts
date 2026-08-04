import { supabase, supabaseConfigError } from './supabase';
import {
  listExcursoes, createExcursao, updateExcursao, deleteExcursao,
  listExcursoesFull, createExcursaoFull, updateExcursaoFull, deleteExcursaoFull,
  listFrota, createFrota, updateFrota, deleteFrota,
  listDepoimentos, createDepoimento, updateDepoimento, deleteDepoimento,
  listBlog, createBlog, updateBlog, deleteBlog,
  listLeads, deleteLead, curriculoSignedUrl,
  uploadFoto, removeFoto, fotoPublicUrl, slugify, linesToArray, arrayToLines
} from './api';
import type {
  ExcursaoCompras, ExcursaoComprasInput,
  Excursao, ExcursaoInput, ExcursaoCategoria,
  FrotaVeiculo, FrotaInput, FrotaCategoria,
  Depoimento, DepoimentoInput,
  BlogPost, BlogPostInput, BlogCategoria,
  ContatoLead, ContatoTipo
} from './types';

const app = document.getElementById('app')!;

type ModuleId = 'compras' | 'excursoes' | 'frota' | 'depoimentos' | 'blog' | 'leads';

const MODULES: { id: ModuleId; label: string }[] = [
  { id: 'compras', label: 'Compras (Home)' },
  { id: 'excursoes', label: 'Excursões / Pacotes' },
  { id: 'frota', label: 'Frota' },
  { id: 'depoimentos', label: 'Depoimentos' },
  { id: 'blog', label: 'Blog' },
  { id: 'leads', label: 'Leads (Contato)' }
];

const CAT_LABEL: Record<ExcursaoCategoria, string> = {
  compras: 'Compras',
  romaria: 'Romaria',
  pescaria: 'Pescaria',
  nacional: 'Turismo Nacional',
  internacional: 'Turismo Internacional',
  pacote: 'Pacote'
};

const FROTA_LABEL: Record<FrotaCategoria, string> = {
  leito: 'Leito Cama',
  semi: 'Semi-Leito',
  executivo: 'Executivo'
};

const BLOG_LABEL: Record<BlogCategoria, string> = {
  fretamento: 'Fretamento B2B',
  compras: 'Compras',
  romarias: 'Romarias',
  pescarias: 'Pescarias',
  pacotes: 'Pacotes',
  dicas: 'Dicas',
  institucional: 'Institucional'
};

const LEAD_LABEL: Record<ContatoTipo, string> = {
  fretamento: 'Fretamento',
  excursoes: 'Excursões',
  encomendas: 'Encomendas',
  trabalhe: 'Trabalhe Conosco'
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};

const strOrNull = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};

let currentModule: ModuleId = 'compras';

/* ---------------- LOGIN ---------------- */
function renderLogin(errorMsg = '') {
  app.innerHTML = `
    <div class="auth">
      <form class="card auth__card" id="loginForm">
        <h1>Painel Administrativo</h1>
        <p class="muted">Mundo das Águas · Conteúdo do site</p>
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
  });
}

/* ---------------- SHELL ---------------- */
function renderShell() {
  app.innerHTML = `
    <header class="topbar">
      <div>
        <strong>Mundo das Águas</strong>
        <span class="muted"> · Painel Administrativo</span>
      </div>
      <button class="btn btn--ghost" id="logoutBtn">Sair</button>
    </header>
    <nav class="tabs" id="tabs">
      ${MODULES.map((m) => `
        <button type="button" class="tabs__btn${m.id === currentModule ? ' active' : ''}" data-mod="${m.id}">${m.label}</button>
      `).join('')}
    </nav>
    <main class="wrap" id="moduleRoot"><p class="muted">Carregando…</p></main>
    <div id="modalRoot"></div>`;

  document.getElementById('logoutBtn')!.addEventListener('click', () => supabase.auth.signOut());
  document.getElementById('tabs')!.querySelectorAll<HTMLButtonElement>('[data-mod]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentModule = btn.dataset.mod as ModuleId;
      document.querySelectorAll('.tabs__btn').forEach((b) => b.classList.toggle('active', (b as HTMLElement).dataset.mod === currentModule));
      void renderModule();
    });
  });
  void renderModule();
}

async function renderModule() {
  const root = document.getElementById('moduleRoot');
  if (!root) return;
  root.innerHTML = `<p class="muted">Carregando…</p>`;
  try {
    if (currentModule === 'compras') await renderCompras(root);
    else if (currentModule === 'excursoes') await renderExcursoesFull(root);
    else if (currentModule === 'frota') await renderFrota(root);
    else if (currentModule === 'depoimentos') await renderDepoimentos(root);
    else if (currentModule === 'blog') await renderBlog(root);
    else if (currentModule === 'leads') await renderLeads(root);
  } catch (err) {
    root.innerHTML = `<div class="card error">Erro: ${esc((err as Error).message)}</div>`;
  }
}

function sectionHead(title: string, newLabel: string) {
  return `
    <div class="section-head">
      <h2>${title}</h2>
      <button class="btn btn--primary" id="newBtn">${newLabel}</button>
    </div>
    <div id="list"></div>`;
}

function wireNew(onNew: () => void) {
  document.getElementById('newBtn')?.addEventListener('click', onNew);
}

function closeModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (modalRoot) modalRoot.innerHTML = '';
}

function confirmDelete(title: string, name: string, onOk: () => Promise<void>) {
  const modalRoot = document.getElementById('modalRoot')!;
  modalRoot.innerHTML = `
    <div class="overlay" id="overlay">
      <div class="card modal modal--sm">
        <h3>${esc(title)}</h3>
        <p>Tem certeza que deseja excluir <b>${esc(name)}</b>? Esta ação não pode ser desfeita.</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button class="btn btn--danger" id="okBtn">Excluir</button>
        </div>
      </div>
    </div>`;
  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('okBtn')!.addEventListener('click', async () => {
    const btn = document.getElementById('okBtn') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Excluindo…';
    try {
      await onOk();
      closeModal();
      await renderModule();
    } catch (err) {
      alert('Erro ao excluir: ' + (err as Error).message);
      closeModal();
    }
  });
}

/* ==================== COMPRAS ==================== */
async function renderCompras(root: HTMLElement) {
  root.innerHTML = sectionHead('Excursões de Compras', '+ Nova');
  wireNew(() => openComprasForm());
  const rows = await listExcursoes();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhuma excursão de compras cadastrada.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th></th><th>Destino</th><th>Saída</th><th>Retorno</th><th>Ordem</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => {
    const url = fotoPublicUrl(r.foto_path);
    const thumb = url ? `<img class="thumb" src="${esc(url)}" alt="">` : `<span class="thumb thumb--empty">sem foto</span>`;
    return `<tr>
      <td>${thumb}</td>
      <td><b>${esc(r.destino)}</b><br><span class="muted">${esc(r.cidade_estado || '')}</span></td>
      <td>${fmtDate(r.data_saida)}</td>
      <td>${fmtDate(r.data_retorno)}</td>
      <td>${r.ordem}</td>
      <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
      <td class="actions">
        <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
        <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openComprasForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir', row.destino, async () => {
        await deleteExcursao(row.id);
        await removeFoto(row.foto_path);
      });
    }));
}

function openComprasForm(row?: ExcursaoCompras) {
  const isEdit = !!row;
  const currentUrl = fotoPublicUrl(row?.foto_path);
  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Nova'} excursão de compras</h3>
        <div class="grid2">
          <label>Destino *<input name="destino" required value="${esc(row?.destino || '')}"></label>
          <label>Cidade / Estado<input name="cidade_estado" value="${esc(row?.cidade_estado || '')}"></label>
          <label>Embarque<input name="cidade_embarque" value="${esc(row?.cidade_embarque || '')}"></label>
          <label>Faixa de destaque<input name="faixa_destaque" value="${esc(row?.faixa_destaque || '')}" placeholder="Próxima saída"></label>
          <label>Data de saída<input type="date" name="data_saida" value="${esc(row?.data_saida || '')}"></label>
          <label>Data de retorno<input type="date" name="data_retorno" value="${esc(row?.data_retorno || '')}"></label>
          <label>Link do botão<input name="link" value="${esc(row?.link || '')}"></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo (Home)</label>
        <label>Foto<input type="file" name="foto" accept="image/*"></label>
        ${currentUrl ? `<div class="preview"><img src="${esc(currentUrl)}" alt=""><span class="muted">Foto atual</span></div>` : ''}
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">Salvar</button>
        </div>
      </form>
    </div>`;
  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('exForm')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const fd = new FormData(form);
      const file = fd.get('foto') as File | null;
      let foto_path = row?.foto_path ?? null;
      if (file && file.size > 0) {
        const newPath = await uploadFoto(file, 'compras');
        if (isEdit && row?.foto_path) await removeFoto(row.foto_path);
        foto_path = newPath;
      }
      const input: ExcursaoComprasInput = {
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
      closeModal();
      await renderModule();
    } catch (err) {
      errEl.textContent = 'Erro: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
    }
  });
}

/* ==================== EXCURSÕES FULL ==================== */
async function renderExcursoesFull(root: HTMLElement) {
  root.innerHTML = sectionHead('Excursões / Pacotes (página completa)', '+ Nova');
  wireNew(() => openExcursaoFullForm());
  const rows = await listExcursoesFull();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhuma excursão/pacote cadastrado. Ao salvar, a página <code>pages/excursao.html?slug=...</code> passa a funcionar.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th></th><th>Nome</th><th>Categoria</th><th>Slug</th><th>Saída</th><th>Home</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => {
    const url = fotoPublicUrl(r.foto_capa_path);
    const thumb = url ? `<img class="thumb" src="${esc(url)}" alt="">` : `<span class="thumb thumb--empty">sem foto</span>`;
    return `<tr>
      <td>${thumb}</td>
      <td><b>${esc(r.nome)}</b></td>
      <td><span class="pill">${esc(CAT_LABEL[r.categoria])}</span></td>
      <td><code>${esc(r.slug)}</code></td>
      <td>${fmtDate(r.data_saida)}</td>
      <td>${r.destaque_home ? 'Sim' : '—'}</td>
      <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
      <td class="actions">
        <a class="btn btn--sm" href="../pages/excursao.html?slug=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">Ver</a>
        <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
        <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openExcursaoFullForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir', row.nome, async () => {
        await deleteExcursaoFull(row.id);
        await removeFoto(row.foto_capa_path);
      });
    }));
}

function openExcursaoFullForm(row?: Excursao) {
  const isEdit = !!row;
  const currentUrl = fotoPublicUrl(row?.foto_capa_path);
  const cats = (Object.keys(CAT_LABEL) as ExcursaoCategoria[])
    .map((c) => `<option value="${c}" ${row?.categoria === c ? 'selected' : ''}>${CAT_LABEL[c]}</option>`)
    .join('');
  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal modal--lg" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Nova'} excursão / pacote</h3>
        <div class="grid2">
          <label>Nome *<input name="nome" required value="${esc(row?.nome || '')}"></label>
          <label>Slug *<input name="slug" required value="${esc(row?.slug || '')}" placeholder="aparecida-marco-2026"></label>
          <label>Categoria *<select name="categoria" required>${cats}</select></label>
          <label>Período (texto)<input name="periodo_texto" value="${esc(row?.periodo_texto || '')}" placeholder="12 a 15 de março"></label>
          <label>Cidade / Estado<input name="cidade_estado" value="${esc(row?.cidade_estado || '')}"></label>
          <label>Embarque<input name="cidade_embarque" value="${esc(row?.cidade_embarque || '')}"></label>
          <label>Data saída<input type="date" name="data_saida" value="${esc(row?.data_saida || '')}"></label>
          <label>Data retorno<input type="date" name="data_retorno" value="${esc(row?.data_retorno || '')}"></label>
          <label>Faixa destaque<input name="faixa_destaque" value="${esc(row?.faixa_destaque || '')}"></label>
          <label>Link reserva / WhatsApp<input name="link_reserva" value="${esc(row?.link_reserva || '')}"></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label>Sobre a excursão<textarea name="sobre" rows="3">${esc(row?.sobre || '')}</textarea></label>
        <label>Resumo (1 item por linha)<textarea name="resumo" rows="3" placeholder="Ônibus leito&#10;Guia acompanhante">${esc(arrayToLines(row?.resumo))}</textarea></label>
        <label>O que está incluso (1 por linha)<textarea name="incluso" rows="4">${esc(arrayToLines(row?.incluso))}</textarea></label>
        <label>Roteiro (formato: Dia 1 | Título | Descrição — um por linha)<textarea name="roteiro" rows="4" placeholder="Dia 1 | Saída | Embarque em Foz às 20h">${esc((row?.roteiro || []).map((r) => `${r.dia} | ${r.titulo} | ${r.descricao}`).join('\n'))}</textarea></label>
        <label>Informações importantes (1 por linha)<textarea name="infos" rows="3">${esc(arrayToLines(row?.infos_importantes))}</textarea></label>
        <label>Formas de pagamento<textarea name="formas_pagamento" rows="2">${esc(row?.formas_pagamento || '')}</textarea></label>
        <div class="checks">
          <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo</label>
          <label class="check"><input type="checkbox" name="destaque_home" ${row?.destaque_home ? 'checked' : ''}> Destaque na Home (Pacotes)</label>
        </div>
        <label>Foto capa<input type="file" name="foto" accept="image/*"></label>
        ${currentUrl ? `<div class="preview"><img src="${esc(currentUrl)}" alt=""><span class="muted">Capa atual</span></div>` : ''}
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">Salvar</button>
        </div>
      </form>
    </div>`;

  const form = document.getElementById('exForm') as HTMLFormElement;
  const nomeInput = form.querySelector<HTMLInputElement>('[name=nome]')!;
  const slugInput = form.querySelector<HTMLInputElement>('[name=slug]')!;
  if (!isEdit) {
    nomeInput.addEventListener('blur', () => {
      if (!slugInput.value.trim()) slugInput.value = slugify(nomeInput.value);
    });
  }

  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const fd = new FormData(form);
      const file = fd.get('foto') as File | null;
      let foto_capa_path = row?.foto_capa_path ?? null;
      if (file && file.size > 0) {
        const newPath = await uploadFoto(file, 'excursoes');
        if (isEdit && row?.foto_capa_path) await removeFoto(row.foto_capa_path);
        foto_capa_path = newPath;
      }
      const roteiro = linesToArray(String(fd.get('roteiro') || '')).map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return { dia: parts[0] || '', titulo: parts[1] || '', descricao: parts[2] || '' };
      });
      const input: ExcursaoInput = {
        slug: slugify(String(fd.get('slug')).trim() || String(fd.get('nome'))),
        categoria: String(fd.get('categoria')) as ExcursaoCategoria,
        nome: String(fd.get('nome')).trim(),
        periodo_texto: strOrNull(fd.get('periodo_texto')),
        cidade_estado: strOrNull(fd.get('cidade_estado')),
        cidade_embarque: strOrNull(fd.get('cidade_embarque')),
        data_saida: strOrNull(fd.get('data_saida')),
        data_retorno: strOrNull(fd.get('data_retorno')),
        faixa_destaque: strOrNull(fd.get('faixa_destaque')),
        foto_capa_path,
        galeria: row?.galeria || [],
        resumo: linesToArray(String(fd.get('resumo') || '')),
        sobre: strOrNull(fd.get('sobre')),
        incluso: linesToArray(String(fd.get('incluso') || '')),
        roteiro,
        infos_importantes: linesToArray(String(fd.get('infos') || '')),
        formas_pagamento: strOrNull(fd.get('formas_pagamento')),
        link_reserva: strOrNull(fd.get('link_reserva')),
        ordem: Number(fd.get('ordem') || 0),
        ativo: fd.get('ativo') === 'on',
        destaque_home: fd.get('destaque_home') === 'on'
      };
      if (isEdit && row) await updateExcursaoFull(row.id, input);
      else await createExcursaoFull(input);
      closeModal();
      await renderModule();
    } catch (err) {
      errEl.textContent = 'Erro: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
    }
  });
}

/* ==================== FROTA ==================== */
async function renderFrota(root: HTMLElement) {
  root.innerHTML = sectionHead('Frota', '+ Veículo');
  wireNew(() => openFrotaForm());
  const rows = await listFrota();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhum veículo cadastrado. Cadastre para alimentar a página <code>pages/frota.html</code>.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th>Foto</th><th>Nome</th><th>Categoria</th><th>Lugares</th><th>Fotos</th><th>Ordem</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => {
    const thumb = fotoPublicUrl(r.galeria?.[0]) || null;
    const nFotos = (r.galeria || []).length;
    return `<tr>
    <td>${thumb
      ? `<img class="thumb" src="${esc(thumb)}" alt="">`
      : `<span class="thumb thumb--empty">${nFotos ? 'local' : 'sem foto'}</span>`}</td>
    <td><b>${esc(r.nome)}</b><br><span class="muted">${esc(r.modelo || '')}</span></td>
    <td><span class="pill">${esc(FROTA_LABEL[r.categoria])}</span></td>
    <td>${esc(r.lugares || '—')}</td>
    <td>${nFotos}</td>
    <td>${r.ordem}</td>
    <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
    <td class="actions">
      <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
      <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
    </td>
  </tr>`;
  }).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openFrotaForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir veículo', row.nome, async () => {
        await deleteFrota(row.id);
        await Promise.all((row.galeria || []).map((p) => removeFoto(p)));
      });
    }));
}

function openFrotaForm(row?: FrotaVeiculo) {
  const isEdit = !!row;
  let galeria = [...(row?.galeria || [])];
  const cats = (Object.keys(FROTA_LABEL) as FrotaCategoria[])
    .map((c) => `<option value="${c}" ${row?.categoria === c ? 'selected' : ''}>${FROTA_LABEL[c]}</option>`)
    .join('');
  const f = row?.features || {};

  const renderGallery = () => {
    const box = document.getElementById('galeriaPreview');
    if (!box) return;
    if (!galeria.length) {
      box.innerHTML = `<span class="muted">Nenhuma foto ainda.</span>`;
      return;
    }
    box.innerHTML = galeria.map((path, i) => {
      const url = fotoPublicUrl(path);
      const inner = url
        ? `<img src="${esc(url)}" alt="">`
        : `<span>${esc(path.split('/').pop() || path)}</span>`;
      return `<div class="gallery-admin__item" data-i="${i}">${inner}<button type="button" title="Remover" data-rm="${i}">×</button></div>`;
    }).join('');
    box.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.rm);
        const removed = galeria[i];
        galeria = galeria.filter((_, idx) => idx !== i);
        if (removed && !/^img\//.test(removed) && !removed.startsWith('../')) {
          void removeFoto(removed);
        }
        renderGallery();
      }));
  };

  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal modal--lg" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Novo'} veículo</h3>
        <div class="grid2">
          <label>Nome *<input name="nome" required value="${esc(row?.nome || '')}" placeholder="Marcopolo G8 1210"></label>
          <label>Modelo<input name="modelo" value="${esc(row?.modelo || '')}" placeholder="Double deck · Leito cama"></label>
          <label>Categoria *<select name="categoria">${cats}</select></label>
          <label>Lugares<input name="lugares" value="${esc(row?.lugares || '')}" placeholder="44 + 12"></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label>Descrição<textarea name="descricao" rows="2" placeholder="Ideal para longas distâncias…">${esc(row?.descricao || '')}</textarea></label>
        <div class="checks">
          <label class="check"><input type="checkbox" name="banheiro" ${f.banheiro !== false ? 'checked' : ''}> Banheiro</label>
          <label class="check"><input type="checkbox" name="ar" ${f.ar !== false ? 'checked' : ''}> Ar</label>
          <label class="check"><input type="checkbox" name="usb" ${f.usb !== false ? 'checked' : ''}> USB</label>
          <label class="check"><input type="checkbox" name="midia" ${f.midia ? 'checked' : ''}> Multimídia</label>
          <label class="check"><input type="checkbox" name="bagageiro" ${f.bagageiro !== false ? 'checked' : ''}> Bagageiro</label>
          <label class="check"><input type="checkbox" name="starlink" ${f.starlink ? 'checked' : ''}> Starlink</label>
          <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo</label>
        </div>
        <label>Galeria de fotos<input type="file" name="fotos" accept="image/*" multiple></label>
        <div class="gallery-admin" id="galeriaPreview"></div>
        <p class="muted" style="font-size:.8rem">As fotos novas vão para o Storage. Você pode remover individuais antes de salvar.</p>
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">Salvar</button>
        </div>
      </form>
    </div>`;

  renderGallery();

  const form = document.getElementById('exForm') as HTMLFormElement;
  form.querySelector<HTMLInputElement>('[name=fotos]')!.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const errEl = document.getElementById('formError')!;
    errEl.hidden = true;
    try {
      for (const file of files) {
        const path = await uploadFoto(file, 'frota');
        galeria.push(path);
      }
      renderGallery();
    } catch (err) {
      errEl.textContent = 'Erro no upload: ' + (err as Error).message;
      errEl.hidden = false;
    }
    input.value = '';
  });

  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const input: FrotaInput = {
        nome: String(fd.get('nome')).trim(),
        modelo: strOrNull(fd.get('modelo')),
        categoria: String(fd.get('categoria')) as FrotaCategoria,
        lugares: strOrNull(fd.get('lugares')),
        descricao: strOrNull(fd.get('descricao')),
        features: {
          banheiro: fd.get('banheiro') === 'on',
          ar: fd.get('ar') === 'on',
          usb: fd.get('usb') === 'on',
          midia: fd.get('midia') === 'on',
          bagageiro: fd.get('bagageiro') === 'on',
          starlink: fd.get('starlink') === 'on'
        },
        galeria,
        ordem: Number(fd.get('ordem') || 0),
        ativo: fd.get('ativo') === 'on'
      };
      if (isEdit && row) await updateFrota(row.id, input);
      else await createFrota(input);
      closeModal();
      await renderModule();
    } catch (err) {
      errEl.textContent = 'Erro: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
    }
  });
}

/* ==================== DEPOIMENTOS ==================== */
async function renderDepoimentos(root: HTMLElement) {
  root.innerHTML = sectionHead('Depoimentos', '+ Depoimento');
  wireNew(() => openDepoimentoForm());
  const rows = await listDepoimentos();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhum depoimento. Cadastre para alimentar a Seção 8 da Home.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th>Nome</th><th>Texto</th><th>Contexto</th><th>★</th><th>Ordem</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => `<tr>
    <td><b>${esc(r.nome)}</b></td>
    <td class="clamp">${esc(r.texto)}</td>
    <td>${esc(r.contexto || '—')}</td>
    <td>${r.estrelas}</td>
    <td>${r.ordem}</td>
    <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
    <td class="actions">
      <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
      <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
    </td>
  </tr>`).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openDepoimentoForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir', row.nome, async () => { await deleteDepoimento(row.id); });
    }));
}

function openDepoimentoForm(row?: Depoimento) {
  const isEdit = !!row;
  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Novo'} depoimento</h3>
        <div class="grid2">
          <label>Nome *<input name="nome" required value="${esc(row?.nome || '')}"></label>
          <label>Estrelas<input type="number" min="1" max="5" name="estrelas" value="${row?.estrelas ?? 5}"></label>
          <label>Contexto<input name="contexto" value="${esc(row?.contexto || '')}" placeholder="Foz · Compras no Brás"></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label>Depoimento *<textarea name="texto" rows="4" required>${esc(row?.texto || '')}</textarea></label>
        <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo</label>
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">Salvar</button>
        </div>
      </form>
    </div>`;
  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('exForm')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const input: DepoimentoInput = {
        nome: String(fd.get('nome')).trim(),
        texto: String(fd.get('texto')).trim(),
        contexto: strOrNull(fd.get('contexto')),
        estrelas: Math.min(5, Math.max(1, Number(fd.get('estrelas') || 5))),
        ordem: Number(fd.get('ordem') || 0),
        ativo: fd.get('ativo') === 'on'
      };
      if (isEdit && row) await updateDepoimento(row.id, input);
      else await createDepoimento(input);
      closeModal();
      await renderModule();
    } catch (err) {
      errEl.textContent = 'Erro: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
    }
  });
}

/* ==================== BLOG ==================== */
async function renderBlog(root: HTMLElement) {
  root.innerHTML = sectionHead('Blog', '+ Artigo');
  wireNew(() => openBlogForm());
  const rows = await listBlog();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhum artigo. A página Blog será ligada a estes registros na etapa seguinte.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th>Título</th><th>Categoria</th><th>Data</th><th>Destaque</th><th>Mais lidos</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => `<tr>
    <td><b>${esc(r.titulo)}</b><br><code>${esc(r.slug)}</code></td>
    <td>${esc(BLOG_LABEL[r.categoria])}</td>
    <td>${fmtDate(r.data_publicacao)}</td>
    <td>${r.destaque ? 'Sim' : '—'}</td>
    <td>${r.mais_lidos ? 'Sim' : '—'}</td>
    <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
    <td class="actions">
      <a class="btn btn--sm" href="../pages/blog-artigo.html?slug=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">Ver</a>
      <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
      <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
    </td>
  </tr>`).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openBlogForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir artigo', row.titulo, async () => {
        await deleteBlog(row.id);
        await removeFoto(row.imagem_path);
      });
    }));
}

function openBlogForm(row?: BlogPost) {
  const isEdit = !!row;
  const currentUrl = fotoPublicUrl(row?.imagem_path);
  const cats = (Object.keys(BLOG_LABEL) as BlogCategoria[])
    .map((c) => `<option value="${c}" ${row?.categoria === c ? 'selected' : ''}>${BLOG_LABEL[c]}</option>`)
    .join('');
  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal modal--lg" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Novo'} artigo</h3>
        <div class="grid2">
          <label>Título *<input name="titulo" required value="${esc(row?.titulo || '')}"></label>
          <label>Slug *<input name="slug" required value="${esc(row?.slug || '')}"></label>
          <label>Categoria *<select name="categoria">${cats}</select></label>
          <label>Data<input type="date" name="data_publicacao" value="${esc(row?.data_publicacao || '')}"></label>
          <label>Tempo de leitura (min)<input type="number" name="tempo_leitura" value="${row?.tempo_leitura ?? ''}"></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <label>Resumo<textarea name="resumo" rows="2">${esc(row?.resumo || '')}</textarea></label>
        <label>Conteúdo<textarea name="conteudo" rows="8">${esc(row?.conteudo || '')}</textarea></label>
        <div class="checks">
          <label class="check"><input type="checkbox" name="destaque" ${row?.destaque ? 'checked' : ''}> Destaque</label>
          <label class="check"><input type="checkbox" name="mais_lidos" ${row?.mais_lidos ? 'checked' : ''}> Mais lidos</label>
          <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo</label>
        </div>
        <label>Imagem<input type="file" name="foto" accept="image/*"></label>
        ${currentUrl ? `<div class="preview"><img src="${esc(currentUrl)}" alt=""><span class="muted">Imagem atual</span></div>` : ''}
        <p class="error" id="formError" hidden></p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary" id="saveBtn">Salvar</button>
        </div>
      </form>
    </div>`;

  const form = document.getElementById('exForm') as HTMLFormElement;
  const titulo = form.querySelector<HTMLInputElement>('[name=titulo]')!;
  const slug = form.querySelector<HTMLInputElement>('[name=slug]')!;
  if (!isEdit) {
    titulo.addEventListener('blur', () => {
      if (!slug.value.trim()) slug.value = slugify(titulo.value);
    });
  }
  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const file = fd.get('foto') as File | null;
      let imagem_path = row?.imagem_path ?? null;
      if (file && file.size > 0) {
        const newPath = await uploadFoto(file, 'blog');
        if (isEdit && row?.imagem_path) await removeFoto(row.imagem_path);
        imagem_path = newPath;
      }
      const tempo = strOrNull(fd.get('tempo_leitura'));
      const input: BlogPostInput = {
        slug: slugify(String(fd.get('slug')).trim() || String(fd.get('titulo'))),
        titulo: String(fd.get('titulo')).trim(),
        resumo: strOrNull(fd.get('resumo')),
        conteudo: strOrNull(fd.get('conteudo')),
        categoria: String(fd.get('categoria')) as BlogCategoria,
        imagem_path,
        data_publicacao: strOrNull(fd.get('data_publicacao')),
        tempo_leitura: tempo ? Number(tempo) : null,
        destaque: fd.get('destaque') === 'on',
        mais_lidos: fd.get('mais_lidos') === 'on',
        ativo: fd.get('ativo') === 'on',
        ordem: Number(fd.get('ordem') || 0)
      };
      if (isEdit && row) await updateBlog(row.id, input);
      else await createBlog(input);
      closeModal();
      await renderModule();
    } catch (err) {
      errEl.textContent = 'Erro: ' + (err as Error).message;
      errEl.hidden = false;
      saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
    }
  });
}

/* ==================== LEADS ==================== */
async function renderLeads(root: HTMLElement) {
  root.innerHTML = `
    <div class="section-head">
      <h2>Leads do Contato</h2>
      <button class="btn btn--ghost" id="refreshLeads">Atualizar</button>
    </div>
    <div id="list"></div>`;
  document.getElementById('refreshLeads')!.addEventListener('click', () => void renderModule());

  const rows = await listLeads();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhum lead ainda. Os envios da página Contato aparecem aqui.</div>`;
    return;
  }

  list.innerHTML = `<table class="table"><thead><tr>
    <th>Data</th><th>Tipo</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Detalhes</th><th></th>
  </tr></thead><tbody>${rows.map((r) => {
    const campos = Object.entries(r.campos || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ');
    const msg = r.mensagem ? `<div class="muted clamp">${esc(r.mensagem)}</div>` : '';
    return `<tr>
      <td>${fmtDate((r.created_at || '').slice(0, 10))}<br><span class="muted">${esc((r.created_at || '').slice(11, 16))}</span></td>
      <td><span class="pill">${esc(LEAD_LABEL[r.tipo] || r.tipo)}</span></td>
      <td><b>${esc(r.nome)}</b></td>
      <td><a href="https://wa.me/55${esc(r.telefone.replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(r.telefone)}</a></td>
      <td>${esc(r.email || '—')}</td>
      <td>${esc(campos || '—')}${msg}</td>
      <td class="actions">
        ${r.curriculo_path ? `<button class="btn btn--sm" data-cv="${esc(r.curriculo_path)}">Currículo</button>` : ''}
        <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>
      </td>
    </tr>`;
  }).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-cv]').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true;
      const url = await curriculoSignedUrl(b.dataset.cv!);
      b.disabled = false;
      if (url) window.open(url, '_blank');
      else alert('Não foi possível gerar o link do currículo.');
    }));

  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del) as ContatoLead | undefined;
      if (row) confirmDelete('Excluir lead', row.nome, async () => { await deleteLead(row.id); });
    }));
}

/* ==================== BOOTSTRAP ---------------- */
if (supabaseConfigError) {
  app.innerHTML = `<div class="auth"><div class="card auth__card"><h1>Configuração incompleta</h1><p class="error">${esc(supabaseConfigError)}</p></div></div>`;
} else {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) renderShell();
    else renderLogin();
  });

  (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) renderShell();
      else renderLogin();
    } catch (err) {
      app.innerHTML = `<div class="auth"><div class="card auth__card"><h1>Erro ao iniciar</h1><p class="error">${esc((err as Error).message)}</p></div></div>`;
    }
  })();
}
