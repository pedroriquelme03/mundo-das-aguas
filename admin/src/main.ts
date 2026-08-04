import { supabase, supabaseConfigError } from './supabase';
import {
  listExcursoes, createExcursao, updateExcursao, deleteExcursao,
  listExcursoesFull, createExcursaoFull, updateExcursaoFull, deleteExcursaoFull,
  listFrota, createFrota, updateFrota, deleteFrota,
  listDepoimentos, createDepoimento, updateDepoimento, deleteDepoimento,
  listBlog, createBlog, updateBlog, deleteBlog,
  listLeads, deleteLead, curriculoSignedUrl,
  uploadFoto, removeFoto, fotoPublicUrl, listStorageImages, MEDIA_FOLDERS,
  listAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  getSiteSettings, saveSiteSettings, DEFAULT_SITE_SETTINGS,
  getSiteContact, saveSiteContact, DEFAULT_SITE_CONTACT,
  listBioLinks, createBioLink, updateBioLink, deleteBioLink,
  slugify, linesToArray, arrayToLines
} from './api';
import type { StorageImage, AdminUserRow } from './api';
import type { SiteSettings, SiteContact, SiteContactInput, BioLink, BioLinkInput, BioLinkEstilo } from './types';
import {
  canWrite, canManageUsers, setSessionUser, getRole, getUserEmail, getUserId,
  ROLE_LABEL, ROLE_HINT, type PainelRole
} from './roles';
import {
  loadImageSettings, saveImageSettings, openImageCropper, maybeOptimizeForUpload,
  formatBytes, ASPECT_HINTS, type AspectPreset, type ImageOptimizeSettings
} from './imageOptimize';
import type {
  ExcursaoCompras, ExcursaoComprasInput,
  Excursao, ExcursaoInput, ExcursaoCategoria,
  FrotaVeiculo, FrotaInput, FrotaCategoria,
  Depoimento, DepoimentoInput,
  BlogPost, BlogPostInput, BlogCategoria,
  ContatoLead, ContatoTipo
} from './types';

const app = document.getElementById('app')!;
const LOGO_URL = `${import.meta.env.BASE_URL}images/logogomarca-mundo.png`;

type ModuleId = 'compras' | 'excursoes' | 'frota' | 'depoimentos' | 'blog' | 'leads' | 'biblioteca' | 'midia' | 'usuarios' | 'settings' | 'contato' | 'bio';

const ICON = {
  compras: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  excursoes: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/><path d="M5 16h2"/><path d="M17 16h2"/></svg>',
  frota: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  depoimentos: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  blog: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  leads: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>',
  biblioteca: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  midia: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>',
  contato: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  bio: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  logout: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
};

const MODULES: { id: ModuleId; label: string; group: string; icon: string }[] = [
  { id: 'compras', label: 'Compras (Home)', group: 'Conteúdo', icon: ICON.compras },
  { id: 'excursoes', label: 'Excursões / Pacotes', group: 'Conteúdo', icon: ICON.excursoes },
  { id: 'frota', label: 'Frota', group: 'Conteúdo', icon: ICON.frota },
  { id: 'depoimentos', label: 'Depoimentos', group: 'Conteúdo', icon: ICON.depoimentos },
  { id: 'blog', label: 'Blog', group: 'Conteúdo', icon: ICON.blog },
  { id: 'bio', label: 'Bio / Links', group: 'Conteúdo', icon: ICON.bio },
  { id: 'leads', label: 'Leads (Contato)', group: 'Atendimento', icon: ICON.leads },
  { id: 'biblioteca', label: 'Mídias', group: 'Ferramentas', icon: ICON.biblioteca },
  { id: 'midia', label: 'Otimizar imagens', group: 'Ferramentas', icon: ICON.midia },
  { id: 'contato', label: 'Contato do site', group: 'Sistema', icon: ICON.contato },
  { id: 'settings', label: 'General Settings', group: 'Sistema', icon: ICON.settings },
  { id: 'usuarios', label: 'Usuários', group: 'Sistema', icon: ICON.usuarios }
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

/** Aplica crop/compressão/WebP conforme config (ou devolve o original). null = cancelado. */
async function prepareImageFile(file: File | null | undefined): Promise<File | null | undefined> {
  if (!file || file.size === 0) return file;
  return maybeOptimizeForUpload(file);
}

let currentModule: ModuleId = 'compras';
let didRefreshRole = false;

/* ---------------- LOGIN ---------------- */
function renderLogin(errorMsg = '') {
  app.innerHTML = `
    <div class="auth">
      <form class="card auth__card" id="loginForm">
        <div class="auth__brand">
          <img src="${LOGO_URL}" alt="Mundo das Águas Turismo" class="auth__logo" width="220" height="72">
        </div>
        <h1>Painel Administrativo</h1>
        <p class="muted">Conteúdo do site</p>
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
async function renderShell() {
  if (!didRefreshRole) {
    didRefreshRole = true;
    await supabase.auth.refreshSession();
  }
  const { data: sess } = await supabase.auth.getSession();
  setSessionUser(sess.session?.user ?? null);

  const visibleModules = MODULES.filter((m) => m.id !== 'usuarios' || canManageUsers());
  if (!visibleModules.some((m) => m.id === currentModule)) {
    currentModule = visibleModules[0]?.id || 'compras';
  }

  const groups = [...new Set(visibleModules.map((m) => m.group))];
  const currentLabel = visibleModules.find((m) => m.id === currentModule)?.label || '';
  const role = getRole();

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <img src="${LOGO_URL}" alt="Mundo das Águas Turismo" class="sidebar__logo" width="180" height="58">
          <span>Painel</span>
        </div>
        <nav class="sidebar__nav" id="sideNav">
          ${groups.map((group) => `
            <p class="sidebar__group">${esc(group)}</p>
            ${visibleModules.filter((m) => m.group === group).map((m) => `
              <button type="button" class="sidebar__link${m.id === currentModule ? ' active' : ''}" data-mod="${m.id}">
                <span class="sidebar__icon" aria-hidden="true">${m.icon}</span>
                <span>${esc(m.label)}</span>
              </button>
            `).join('')}
          `).join('')}
        </nav>
        <div class="sidebar__foot">
          <div class="sidebar__user">
            <strong>${esc(getUserEmail() || 'Usuário')}</strong>
            <span>${esc(ROLE_LABEL[role])}</span>
          </div>
          <button type="button" class="sidebar__link sidebar__link--muted" id="logoutBtn">
            <span class="sidebar__icon" aria-hidden="true">${ICON.logout}</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <div class="layout__main">
        <header class="topbar">
          <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Abrir menu">☰</button>
          <div class="topbar__title">
            <strong id="pageTitle">${esc(currentLabel)}</strong>
            <span class="muted">${!canWrite() ? 'Modo leitura' : 'Administração do site'}</span>
          </div>
          <span class="role-badge role-badge--${role}">${esc(ROLE_LABEL[role])}</span>
        </header>
        <main class="wrap" id="moduleRoot"><p class="muted">Carregando…</p></main>
        <footer class="admin-footer">
          <a class="admin-footer__support" href="https://wa.me/5545991070844?text=${encodeURIComponent('Olá! Preciso de suporte no painel admin.')}" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span><strong>Suporte Online 24h</strong> WhatsApp +55 45 99107-0844</span>
          </a>
        </footer>
      </div>
    </div>
    <div class="sidebar-backdrop" id="sidebarBackdrop" hidden></div>
    <div id="modalRoot"></div>`;

  document.getElementById('logoutBtn')!.addEventListener('click', () => supabase.auth.signOut());

  const setActive = (id: ModuleId) => {
    currentModule = id;
    document.querySelectorAll('.sidebar__link[data-mod]').forEach((b) =>
      b.classList.toggle('active', (b as HTMLElement).dataset.mod === id));
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = visibleModules.find((m) => m.id === id)?.label || '';
    closeMobileSidebar();
    void renderModule();
  };

  document.getElementById('sideNav')!.querySelectorAll<HTMLButtonElement>('[data-mod]').forEach((btn) => {
    btn.addEventListener('click', () => setActive(btn.dataset.mod as ModuleId));
  });

  const backdrop = document.getElementById('sidebarBackdrop')!;
  document.getElementById('sidebarToggle')!.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
    backdrop.hidden = !document.body.classList.contains('sidebar-open');
  });
  backdrop.addEventListener('click', closeMobileSidebar);

  void renderModule();
}

function closeMobileSidebar() {
  document.body.classList.remove('sidebar-open');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) backdrop.hidden = true;
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
    else if (currentModule === 'bio') await renderBio(root);
    else if (currentModule === 'leads') await renderLeads(root);
    else if (currentModule === 'biblioteca') await renderBiblioteca(root);
    else if (currentModule === 'midia') await renderMidia(root);
    else if (currentModule === 'usuarios') await renderUsuarios(root);
    else if (currentModule === 'contato') await renderContato(root);
    else if (currentModule === 'settings') await renderSettings(root);
  } catch (err) {
    root.innerHTML = `<div class="card error">Erro: ${esc((err as Error).message)}</div>`;
  }
}

function sectionHead(title: string, newLabel: string) {
  return `
    <div class="section-head">
      <h2>${title}</h2>
      ${canWrite()
        ? `<button class="btn btn--primary" id="newBtn">${newLabel}</button>`
        : `<span class="role-hint muted">Somente leitura</span>`}
    </div>
    <div id="list"></div>`;
}

function contentActions(id: string): string {
  if (!canWrite()) {
    return `<td class="actions"><span class="muted">Somente leitura</span></td>`;
  }
  return `<td class="actions">
    <button class="btn btn--sm" data-edit="${esc(id)}">Editar</button>
    <button class="btn btn--sm btn--danger" data-del="${esc(id)}">Excluir</button>
  </td>`;
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
      ${contentActions(r.id)}
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
        const optimized = await prepareImageFile(file);
        if (optimized === null) throw new Error('Otimização cancelada.');
        const newPath = await uploadFoto(optimized!, 'compras');
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
    list.innerHTML = `<div class="card empty">Nenhuma excursão/pacote cadastrado. Ao salvar, a página <code>/excursao?slug=...</code> passa a funcionar.</div>`;
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
        <a class="btn btn--sm" href="/excursao?slug=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">Ver</a>
        ${canWrite() ? `
          <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
          <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>` : ''}
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
        const optimized = await prepareImageFile(file);
        if (optimized === null) throw new Error('Otimização cancelada.');
        const newPath = await uploadFoto(optimized!, 'excursoes');
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
    list.innerHTML = `<div class="card empty">Nenhum veículo cadastrado. Cadastre para alimentar a página <code>/frota</code>.</div>`;
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
    ${contentActions(r.id)}
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
        const optimized = await prepareImageFile(file);
        if (optimized === null) continue;
        const path = await uploadFoto(optimized!, 'frota');
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
    ${contentActions(r.id)}
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
      <a class="btn btn--sm" href="/blog/artigo?slug=${encodeURIComponent(r.slug)}" target="_blank" rel="noopener">Ver</a>
      ${canWrite() ? `
        <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
        <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>` : ''}
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
        const optimized = await prepareImageFile(file);
        if (optimized === null) throw new Error('Otimização cancelada.');
        const newPath = await uploadFoto(optimized!, 'blog');
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

/* ==================== BIO / LINKS ==================== */
const BIO_ESTILO_LABEL: Record<BioLinkEstilo, string> = {
  padrao: 'Padrão',
  whatsapp: 'WhatsApp'
};

async function renderBio(root: HTMLElement) {
  root.innerHTML = `
    <div class="section-head">
      <h2>Bio / Links</h2>
      ${canWrite()
        ? `<button class="btn btn--primary" id="newBtn">+ Botão</button>`
        : `<span class="role-hint muted">Somente leitura</span>`}
    </div>
    <p class="muted bib-intro">Botões da página pública <a href="/bio" target="_blank" rel="noopener">/bio</a> (Instagram e linktree).</p>
    <div id="list"></div>`;
  wireNew(() => openBioForm());

  const rows = await listBioLinks();
  const list = document.getElementById('list')!;
  if (!rows.length) {
    list.innerHTML = `<div class="card empty">Nenhum botão. Cadastre os links da bio.</div>`;
    return;
  }
  list.innerHTML = `<table class="table"><thead><tr>
    <th>Ordem</th><th>Título</th><th>URL</th><th>Estilo</th><th>Nova aba</th><th>Ativo</th><th></th>
  </tr></thead><tbody>${rows.map((r) => `<tr>
    <td>${r.ordem}</td>
    <td><b>${esc(r.titulo)}</b></td>
    <td class="clamp"><code>${esc(r.url)}</code></td>
    <td>${esc(BIO_ESTILO_LABEL[r.estilo] || r.estilo)}</td>
    <td>${r.nova_aba ? 'Sim' : 'Não'}</td>
    <td>${r.ativo ? '<span class="dot dot--on"></span>Sim' : '<span class="dot"></span>Não'}</td>
    <td class="actions">
      <a class="btn btn--sm" href="${esc(r.url)}" target="_blank" rel="noopener">Abrir</a>
      ${canWrite() ? `
        <button class="btn btn--sm" data-edit="${r.id}">Editar</button>
        <button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>` : ''}
    </td>
  </tr>`).join('')}</tbody></table>`;

  list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.edit);
      if (row) openBioForm(row);
    }));
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const row = rows.find((r) => r.id === b.dataset.del);
      if (row) confirmDelete('Excluir botão', row.titulo, async () => {
        await deleteBioLink(row.id);
      });
    }));
}

function openBioForm(row?: BioLink) {
  const isEdit = !!row;
  const estilos = (Object.keys(BIO_ESTILO_LABEL) as BioLinkEstilo[])
    .map((e) => `<option value="${e}" ${row?.estilo === e ? 'selected' : ''}>${BIO_ESTILO_LABEL[e]}</option>`)
    .join('');
  document.getElementById('modalRoot')!.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal" id="exForm">
        <h3>${isEdit ? 'Editar' : 'Novo'} botão da bio</h3>
        <label>Título *<input name="titulo" required value="${esc(row?.titulo || '')}"></label>
        <label>URL / caminho *<input name="url" required value="${esc(row?.url || '')}" placeholder="/frota ou https://..."></label>
        <div class="grid2">
          <label>Estilo<select name="estilo">${estilos}</select></label>
          <label>Ordem<input type="number" name="ordem" value="${row?.ordem ?? 0}"></label>
        </div>
        <div class="checks">
          <label class="check"><input type="checkbox" name="nova_aba" ${row?.nova_aba !== false ? 'checked' : ''}> Abrir em nova aba</label>
          <label class="check"><input type="checkbox" name="ativo" ${row?.ativo !== false ? 'checked' : ''}> Ativo</label>
        </div>
        <p class="muted" style="font-size:.8rem;margin:0">Use caminhos do site (ex.: /contato) ou URLs completas (WhatsApp, redes).</p>
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
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const errEl = document.getElementById('formError')!;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    errEl.hidden = true; saveBtn.disabled = true; saveBtn.textContent = 'Salvando…';
    try {
      const input: BioLinkInput = {
        titulo: String(fd.get('titulo') || '').trim(),
        url: String(fd.get('url') || '').trim(),
        estilo: String(fd.get('estilo') || 'padrao') as BioLinkEstilo,
        nova_aba: fd.get('nova_aba') === 'on',
        ordem: Number(fd.get('ordem') || 0),
        ativo: fd.get('ativo') === 'on'
      };
      if (!input.titulo || !input.url) throw new Error('Título e URL são obrigatórios.');
      if (isEdit && row) await updateBioLink(row.id, input);
      else await createBioLink(input);
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
        ${canWrite() ? `<button class="btn btn--sm btn--danger" data-del="${r.id}">Excluir</button>` : ''}
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

/* ==================== BIBLIOTECA DE MÍDIAS ==================== */
async function renderBiblioteca(root: HTMLElement) {
  root.innerHTML = `
    <div class="section-head">
      <h2>Mídias</h2>
      <button type="button" class="btn btn--ghost" id="refreshMedia">Atualizar</button>
    </div>
    <p class="muted bib-intro">Imagens do Storage Supabase, agrupadas pela pasta em que foram enviadas no cadastro.</p>
    <div id="bibRoot"><p class="muted">Carregando…</p></div>`;

  document.getElementById('refreshMedia')!.addEventListener('click', () => void renderBiblioteca(root));

  const box = document.getElementById('bibRoot')!;
  try {
    const library = await listStorageImages();
    const total = MEDIA_FOLDERS.reduce((n, f) => n + library[f.id].length, 0);

    if (!total) {
      box.innerHTML = `<div class="card empty">Nenhuma imagem no Storage ainda. As fotos enviadas em Compras, Excursões, Frota e Blog aparecem aqui.</div>`;
      return;
    }

    box.innerHTML = MEDIA_FOLDERS.map((folder) => {
      const items = library[folder.id];
      if (folder.id === 'outros' && !items.length) return '';
      return `
        <section class="bib-section card">
          <header class="bib-section__head">
            <h3>${esc(folder.label)}</h3>
            <span class="bib-count">${items.length} ${items.length === 1 ? 'imagem' : 'imagens'}</span>
          </header>
          ${items.length
            ? `<div class="bib-grid">${items.map((img) => mediaCardHtml(img)).join('')}</div>`
            : `<p class="muted bib-empty">Nenhuma imagem nesta categoria.</p>`}
        </section>`;
    }).join('');

    box.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.copy || '';
        try {
          await navigator.clipboard.writeText(url);
          const prev = btn.textContent;
          btn.textContent = 'Copiado!';
          setTimeout(() => { btn.textContent = prev; }, 1400);
        } catch {
          prompt('URL da imagem:', url);
        }
      });
    });

    box.querySelectorAll<HTMLButtonElement>('[data-del-media]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.delMedia || '';
        const name = btn.dataset.name || path;
        confirmDelete('Excluir mídia', name, async () => {
          await removeFoto(path);
        });
      });
    });
  } catch (err) {
    box.innerHTML = `<div class="card error">Erro ao listar mídias: ${esc((err as Error).message)}</div>`;
  }
}

function mediaCardHtml(img: StorageImage): string {
  const size = img.size != null ? formatBytes(img.size) : '';
  return `
    <article class="bib-card">
      <a class="bib-card__thumb" href="${esc(img.url)}" target="_blank" rel="noopener">
        <img src="${esc(img.url)}" alt="${esc(img.name)}" loading="lazy">
      </a>
      <div class="bib-card__meta">
        <p class="bib-card__name" title="${esc(img.path)}">${esc(img.name)}</p>
        <p class="muted">${size ? esc(size) : '—'}</p>
        <div class="bib-card__actions">
          <button type="button" class="btn btn--sm" data-copy="${esc(img.url)}">Copiar URL</button>
          ${canWrite()
            ? `<button type="button" class="btn btn--sm btn--danger" data-del-media="${esc(img.path)}" data-name="${esc(img.name)}">Excluir</button>`
            : ''}
        </div>
      </div>
    </article>`;
}

/* ==================== GENERAL SETTINGS ==================== */
const LANG_OPTS = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' }
];

const TZ_OPTS = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Rio_Branco',
  'America/Noronha',
  'UTC'
];

const DATE_FMT_OPTS = [
  { value: 'd/m/Y', label: '04/08/2026', sample: true },
  { value: 'd-m-Y', label: '04-08-2026' },
  { value: 'Y-m-d', label: '2026-08-04' },
  { value: 'm/d/Y', label: '08/04/2026' },
  { value: 'd M Y', label: '04 ago 2026' },
  { value: 'F j, Y', label: 'agosto 4, 2026' }
];

const TIME_FMT_OPTS = [
  { value: 'H:i', label: '19:30 (24h)' },
  { value: 'G:i', label: '9:30 (24h sem zero)' },
  { value: 'h:i A', label: '07:30 PM' },
  { value: 'g:i a', label: '7:30 pm' }
];

const WEEK_OPTS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

function applyPanelLanguage(lang: string) {
  document.documentElement.lang = lang || 'pt-BR';
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

function telHref(display: string): string {
  const d = onlyDigits(display);
  if (!d) return '#';
  return d.startsWith('55') ? `tel:+${d}` : `tel:+55${d}`;
}

async function renderContato(root: HTMLElement) {
  root.innerHTML = `<p class="muted">Carregando…</p>`;
  let contact: SiteContact;
  try {
    contact = await getSiteContact();
  } catch (err) {
    root.innerHTML = `<div class="card error">Erro: ${esc((err as Error).message)}</div>`;
    return;
  }

  const writable = canWrite();
  const c = { ...DEFAULT_SITE_CONTACT, ...contact };

  root.innerHTML = `
    <div class="section-head">
      <h2>Contato do site</h2>
      ${writable ? '' : '<span class="role-hint muted">Somente leitura</span>'}
    </div>
    <p class="muted bib-intro">Esses dados alimentam rodapé, botões de WhatsApp, página de Contato e links do site.</p>
    <form class="card settings-form" id="contatoForm">
      <fieldset ${writable ? '' : 'disabled'}>
        <h3 class="settings-section-title">Empresa</h3>
        <div class="settings-row">
          <label for="empresa">Nome</label>
          <div>
            <input id="empresa" name="empresa" type="text" required value="${esc(c.empresa)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="email">E-mail</label>
          <div>
            <input id="email" name="email" type="email" required value="${esc(c.email)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="telefone_agencia">Telefone (agência)</label>
          <div>
            <input id="telefone_agencia" name="telefone_agencia" type="text" required value="${esc(c.telefone_agencia)}" placeholder="(45) 3523-3060">
            <p class="muted settings-help">Exibido no rodapé e na página de contato.</p>
          </div>
        </div>
        <div class="settings-row">
          <label for="horario_atendimento">Horário de atendimento</label>
          <div>
            <textarea id="horario_atendimento" name="horario_atendimento" rows="2">${esc(c.horario_atendimento)}</textarea>
          </div>
        </div>

        <h3 class="settings-section-title">WhatsApp</h3>
        <div class="settings-row">
          <label for="whatsapp_comercial">Comercial (número)</label>
          <div>
            <input id="whatsapp_comercial" name="whatsapp_comercial" type="text" required value="${esc(c.whatsapp_comercial)}" placeholder="5545999677835">
            <p class="muted settings-help">Somente dígitos, com DDI 55 (ex.: 5545999677835).</p>
          </div>
        </div>
        <div class="settings-row">
          <label for="whatsapp_comercial_label">Comercial (exibição)</label>
          <div>
            <input id="whatsapp_comercial_label" name="whatsapp_comercial_label" type="text" required value="${esc(c.whatsapp_comercial_label)}" placeholder="(45) 99967-7835">
          </div>
        </div>
        <div class="settings-row">
          <label for="mensagem_wa_comercial">Mensagem padrão (comercial)</label>
          <div>
            <textarea id="mensagem_wa_comercial" name="mensagem_wa_comercial" rows="2">${esc(c.mensagem_wa_comercial)}</textarea>
            <p class="muted settings-help">Usada quando o link não define outra mensagem.</p>
          </div>
        </div>
        <div class="settings-row">
          <label for="whatsapp_emergencial">Emergencial 24h (número)</label>
          <div>
            <input id="whatsapp_emergencial" name="whatsapp_emergencial" type="text" required value="${esc(c.whatsapp_emergencial)}" placeholder="5545999648080">
          </div>
        </div>
        <div class="settings-row">
          <label for="whatsapp_emergencial_label">Emergencial (exibição)</label>
          <div>
            <input id="whatsapp_emergencial_label" name="whatsapp_emergencial_label" type="text" required value="${esc(c.whatsapp_emergencial_label)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="mensagem_wa_emergencial">Mensagem padrão (emergencial)</label>
          <div>
            <textarea id="mensagem_wa_emergencial" name="mensagem_wa_emergencial" rows="2">${esc(c.mensagem_wa_emergencial)}</textarea>
          </div>
        </div>

        <h3 class="settings-section-title">Endereço</h3>
        <div class="settings-row">
          <label for="endereco_linha1">Endereço</label>
          <div>
            <input id="endereco_linha1" name="endereco_linha1" type="text" required value="${esc(c.endereco_linha1)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="endereco_linha2">Complemento</label>
          <div>
            <input id="endereco_linha2" name="endereco_linha2" type="text" value="${esc(c.endereco_linha2)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="cidade">Cidade</label>
          <div>
            <input id="cidade" name="cidade" type="text" required value="${esc(c.cidade)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="estado">Estado</label>
          <div>
            <input id="estado" name="estado" type="text" required value="${esc(c.estado)}" maxlength="2">
          </div>
        </div>
        <div class="settings-row">
          <label for="cep">CEP</label>
          <div>
            <input id="cep" name="cep" type="text" value="${esc(c.cep)}">
          </div>
        </div>
        <div class="settings-row">
          <label for="mapa_url">Link do mapa</label>
          <div>
            <input id="mapa_url" name="mapa_url" type="url" value="${esc(c.mapa_url)}" placeholder="https://maps.google.com/...">
            <p class="muted settings-help">Botão “Como chegar” no rodapé e na página de contato.</p>
          </div>
        </div>

        ${writable ? `
        <div class="settings-actions">
          <button type="submit" class="btn btn--primary" id="contatoSaveBtn">Salvar alterações</button>
          <span class="muted" id="contatoSaved" hidden>Contato salvo.</span>
        </div>` : ''}
      </fieldset>
    </form>
    <div class="card" style="margin-top:16px;max-width:820px">
      <h3 class="settings-section-title" style="margin-top:0">Prévia</h3>
      <p><strong>${esc(c.empresa)}</strong></p>
      <p>WhatsApp Comercial: <a href="https://wa.me/${esc(onlyDigits(c.whatsapp_comercial))}" target="_blank" rel="noopener">${esc(c.whatsapp_comercial_label)}</a></p>
      <p>Emergencial: <a href="https://wa.me/${esc(onlyDigits(c.whatsapp_emergencial))}" target="_blank" rel="noopener">${esc(c.whatsapp_emergencial_label)}</a></p>
      <p>Agência: <a href="${esc(telHref(c.telefone_agencia))}">${esc(c.telefone_agencia)}</a></p>
      <p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
      <p>${esc(c.endereco_linha1)}${c.endereco_linha2 ? `<br>${esc(c.endereco_linha2)}` : ''}<br>${esc(c.cidade)} – ${esc(c.estado)}${c.cep ? `<br>CEP ${esc(c.cep)}` : ''}</p>
      <p class="muted">${esc(c.horario_atendimento)}</p>
    </div>`;

  if (!writable) return;

  document.getElementById('contatoForm')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const btn = document.getElementById('contatoSaveBtn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Salvando…';
    try {
      const input: SiteContactInput = {
        empresa: String(fd.get('empresa') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        telefone_agencia: String(fd.get('telefone_agencia') || '').trim(),
        whatsapp_comercial: onlyDigits(String(fd.get('whatsapp_comercial') || '')),
        whatsapp_comercial_label: String(fd.get('whatsapp_comercial_label') || '').trim(),
        whatsapp_emergencial: onlyDigits(String(fd.get('whatsapp_emergencial') || '')),
        whatsapp_emergencial_label: String(fd.get('whatsapp_emergencial_label') || '').trim(),
        endereco_linha1: String(fd.get('endereco_linha1') || '').trim(),
        endereco_linha2: String(fd.get('endereco_linha2') || '').trim(),
        cidade: String(fd.get('cidade') || '').trim(),
        estado: String(fd.get('estado') || '').trim().toUpperCase(),
        cep: String(fd.get('cep') || '').trim(),
        mapa_url: String(fd.get('mapa_url') || '').trim(),
        horario_atendimento: String(fd.get('horario_atendimento') || '').trim(),
        mensagem_wa_comercial: String(fd.get('mensagem_wa_comercial') || '').trim(),
        mensagem_wa_emergencial: String(fd.get('mensagem_wa_emergencial') || '').trim()
      };
      if (input.whatsapp_comercial.length < 10 || input.whatsapp_emergencial.length < 10) {
        throw new Error('Números de WhatsApp inválidos. Use DDI + DDD + número.');
      }
      await saveSiteContact(input);
      const msg = document.getElementById('contatoSaved')!;
      msg.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Salvar alterações';
      setTimeout(() => { msg.hidden = true; }, 2500);
      await renderContato(root);
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message);
      btn.disabled = false;
      btn.textContent = 'Salvar alterações';
    }
  });
}

async function renderSettings(root: HTMLElement) {
  root.innerHTML = `<p class="muted">Carregando…</p>`;
  let settings: SiteSettings;
  try {
    settings = await getSiteSettings();
  } catch (err) {
    root.innerHTML = `<div class="card error">Erro: ${esc((err as Error).message)}</div>`;
    return;
  }

  applyPanelLanguage(settings.site_language);
  let iconPath = settings.site_icon_path;
  const writable = canWrite();
  const currentIcon = fotoPublicUrl(iconPath);

  const langOptions = LANG_OPTS.map((o) =>
    `<option value="${o.value}" ${settings.site_language === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  const tzOptions = TZ_OPTS.map((tz) =>
    `<option value="${tz}" ${settings.timezone === tz ? 'selected' : ''}>${tz}</option>`
  ).join('');
  const dateOptions = DATE_FMT_OPTS.map((o) =>
    `<option value="${o.value}" ${settings.date_format === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  const timeOptions = TIME_FMT_OPTS.map((o) =>
    `<option value="${o.value}" ${settings.time_format === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  const weekOptions = WEEK_OPTS.map((o) =>
    `<option value="${o.value}" ${Number(settings.week_starts_on) === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');

  root.innerHTML = `
    <div class="section-head">
      <h2>General Settings</h2>
      ${writable ? '' : '<span class="role-hint muted">Somente leitura</span>'}
    </div>
    <form class="card settings-form" id="settingsForm">
      <fieldset ${writable ? '' : 'disabled'}>
        <div class="settings-row">
          <label for="site_title">Site Title</label>
          <div>
            <input id="site_title" name="site_title" type="text" required value="${esc(settings.site_title)}">
            <p class="muted settings-help">Nome do site exibido em títulos e no painel.</p>
          </div>
        </div>
        <div class="settings-row">
          <label for="tagline">Tagline</label>
          <div>
            <input id="tagline" name="tagline" type="text" value="${esc(settings.tagline)}">
            <p class="muted settings-help">Frase curta que descreve o site.</p>
          </div>
        </div>
        <div class="settings-row">
          <label>Site Icon</label>
          <div>
            <div class="settings-icon" id="settingsIconPreview">
              ${currentIcon
                ? `<img src="${esc(currentIcon)}" alt="Site icon" width="64" height="64">`
                : `<span class="thumb thumb--empty settings-icon__empty">sem ícone</span>`}
            </div>
            <input type="file" id="siteIconFile" accept="image/*" ${writable ? '' : 'disabled'}>
            <p class="muted settings-help">Favicon / ícone do site (recomendado 512×512).</p>
            ${iconPath && writable ? '<button type="button" class="btn btn--sm btn--ghost" id="clearIcon">Remover ícone</button>' : ''}
          </div>
        </div>
        <div class="settings-row">
          <label for="site_language">Site Language (painel)</label>
          <div>
            <select id="site_language" name="site_language">${langOptions}</select>
            <p class="muted settings-help">Idioma da interface do painel administrativo.</p>
          </div>
        </div>
        <div class="settings-row">
          <label for="timezone">Timezone</label>
          <div>
            <select id="timezone" name="timezone">${tzOptions}</select>
          </div>
        </div>
        <div class="settings-row">
          <label for="date_format">Date Format</label>
          <div>
            <select id="date_format" name="date_format">${dateOptions}</select>
          </div>
        </div>
        <div class="settings-row">
          <label for="time_format">Time Format</label>
          <div>
            <select id="time_format" name="time_format">${timeOptions}</select>
          </div>
        </div>
        <div class="settings-row">
          <label for="week_starts_on">Week Starts On</label>
          <div>
            <select id="week_starts_on" name="week_starts_on">${weekOptions}</select>
          </div>
        </div>
        <div class="settings-row">
          <label for="login_url">Login URL</label>
          <div>
            <input id="login_url" name="login_url" type="text" required value="${esc(settings.login_url)}">
            <p class="muted settings-help">Caminho ou URL da tela de login do painel (ex.: /admin/).</p>
          </div>
        </div>
      </fieldset>
      ${writable ? `
        <div class="settings-actions">
          <button type="submit" class="btn btn--primary">Salvar alterações</button>
          <span class="muted" id="settingsSaved" hidden>Configurações salvas.</span>
        </div>` : ''}
    </form>`;

  document.getElementById('clearIcon')?.addEventListener('click', () => {
    iconPath = null;
    const box = document.getElementById('settingsIconPreview')!;
    box.innerHTML = `<span class="thumb thumb--empty settings-icon__empty">sem ícone</span>`;
  });

  document.getElementById('siteIconFile')?.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !writable) return;
    try {
      const optimized = await maybeOptimizeForUpload(file);
      if (optimized === null) return;
      const newPath = await uploadFoto(optimized!, 'settings');
      if (iconPath) await removeFoto(iconPath);
      iconPath = newPath;
      const url = fotoPublicUrl(newPath)!;
      document.getElementById('settingsIconPreview')!.innerHTML =
        `<img src="${esc(url)}" alt="Site icon" width="64" height="64">`;
    } catch (err) {
      alert('Erro no ícone: ' + (err as Error).message);
    }
  });

  if (!writable) return;

  document.getElementById('settingsForm')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Salvando…';
    const fd = new FormData(form);
    try {
      const next = {
        site_title: String(fd.get('site_title') || '').trim() || DEFAULT_SITE_SETTINGS.site_title,
        tagline: String(fd.get('tagline') || '').trim(),
        site_icon_path: iconPath,
        site_language: String(fd.get('site_language') || 'pt-BR'),
        timezone: String(fd.get('timezone') || 'America/Sao_Paulo'),
        date_format: String(fd.get('date_format') || 'd/m/Y'),
        time_format: String(fd.get('time_format') || 'H:i'),
        week_starts_on: Number(fd.get('week_starts_on') ?? 0),
        login_url: String(fd.get('login_url') || '/admin/').trim() || '/admin/'
      };
      await saveSiteSettings(next);
      applyPanelLanguage(next.site_language);
      const msg = document.getElementById('settingsSaved')!;
      msg.hidden = false;
      btn.disabled = false; btn.textContent = 'Salvar alterações';
      setTimeout(() => { msg.hidden = true; }, 2500);
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message);
      btn.disabled = false; btn.textContent = 'Salvar alterações';
    }
  });
}

/* ==================== USUÁRIOS ==================== */
async function renderUsuarios(root: HTMLElement) {
  if (!canManageUsers()) {
    root.innerHTML = `<div class="card error">Acesso restrito a administradores.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="section-head">
      <h2>Usuários do painel</h2>
      <button class="btn btn--primary" id="newBtn">+ Novo usuário</button>
    </div>
    <p class="muted bib-intro">Admin gerencia tudo · Editor altera conteúdo · Leitor só visualiza.</p>
    <div id="list"><p class="muted">Carregando…</p></div>`;

  wireNew(() => openUsuarioForm());

  const list = document.getElementById('list')!;
  try {
    const rows = await listAdminUsers();
    if (!rows.length) {
      list.innerHTML = `<div class="card empty">Nenhum usuário encontrado.</div>`;
      return;
    }
    list.innerHTML = `<table class="table"><thead><tr>
      <th>E-mail</th><th>Função</th><th>Criado em</th><th>Último acesso</th><th></th>
    </tr></thead><tbody>${rows.map((u) => `
      <tr>
        <td><b>${esc(u.email)}</b>${u.id === getUserId() ? ' <span class="pill">você</span>' : ''}</td>
        <td><span class="role-badge role-badge--${esc(u.role)}">${esc(ROLE_LABEL[u.role] || u.role)}</span></td>
        <td>${u.created_at ? esc(new Date(u.created_at).toLocaleString('pt-BR')) : '—'}</td>
        <td>${u.last_sign_in_at ? esc(new Date(u.last_sign_in_at).toLocaleString('pt-BR')) : '—'}</td>
        <td class="actions">
          <button class="btn btn--sm" data-edit="${u.id}">Editar</button>
          ${u.id !== getUserId()
            ? `<button class="btn btn--sm btn--danger" data-del="${u.id}">Excluir</button>`
            : ''}
        </td>
      </tr>`).join('')}</tbody></table>`;

    list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) => {
      b.addEventListener('click', () => {
        const row = rows.find((r) => r.id === b.dataset.edit);
        if (row) openUsuarioForm(row);
      });
    });
    list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) => {
      b.addEventListener('click', () => {
        const row = rows.find((r) => r.id === b.dataset.del);
        if (row) {
          confirmDelete('Excluir usuário', row.email, async () => {
            await deleteAdminUser(row.id);
          });
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="card error">${esc((err as Error).message)}</div>`;
  }
}

function openUsuarioForm(row?: AdminUserRow) {
  const isEdit = Boolean(row);
  const modalRoot = document.getElementById('modalRoot')!;
  const roleOpts = (Object.keys(ROLE_LABEL) as PainelRole[]).map((k) =>
    `<option value="${k}" ${(row?.role || 'editor') === k ? 'selected' : ''}>${ROLE_LABEL[k]} — ${ROLE_HINT[k]}</option>`
  ).join('');

  modalRoot.innerHTML = `
    <div class="overlay" id="overlay">
      <form class="card modal" id="userForm">
        <h3>${isEdit ? 'Editar' : 'Novo'} usuário</h3>
        <label>E-mail
          <input type="email" name="email" required value="${esc(row?.email || '')}" ${isEdit ? '' : 'autocomplete="off"'}>
        </label>
        <label>${isEdit ? 'Nova senha (opcional)' : 'Senha'}
          <input type="password" name="password" ${isEdit ? '' : 'required'} minlength="6" autocomplete="new-password"
            placeholder="${isEdit ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}">
        </label>
        <label>Função
          <select name="role" required>${roleOpts}</select>
        </label>
        <p class="muted" style="font-size:.82rem">Após mudar a função de alguém, essa pessoa precisa sair e entrar de novo (ou atualizar a sessão) para o JWT refletir o papel.</p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="cancelBtn">Cancelar</button>
          <button type="submit" class="btn btn--primary">Salvar</button>
        </div>
      </form>
    </div>`;

  document.getElementById('cancelBtn')!.addEventListener('click', closeModal);
  document.getElementById('overlay')!.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('userForm')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const btn = form.querySelector('button[type=submit]') as HTMLButtonElement;
    btn.disabled = true; btn.textContent = 'Salvando…';
    const fd = new FormData(form);
    try {
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '');
      const role = String(fd.get('role') || '') as PainelRole;
      if (isEdit && row) {
        await updateAdminUser({
          id: row.id,
          email: email !== row.email ? email : undefined,
          password: password || undefined,
          role
        });
      } else {
        await createAdminUser({ email, password, role });
      }
      closeModal();
      await renderModule();
    } catch (err) {
      alert('Erro: ' + (err as Error).message);
      btn.disabled = false; btn.textContent = 'Salvar';
    }
  });
}

/* ==================== MÍDIA / OTIMIZAR ==================== */
async function renderMidia(root: HTMLElement) {
  const s = loadImageSettings();
  const aspects = (Object.keys(ASPECT_HINTS) as AspectPreset[])
    .map((k) => `<option value="${k}" ${s.aspect === k ? 'selected' : ''}>${k} — ${ASPECT_HINTS[k]}</option>`)
    .join('');

  root.innerHTML = `
    <div class="section-head">
      <h2>Otimizar imagens</h2>
    </div>
    <div class="midia-grid">
      <form class="card midia-card" id="midiaSettings">
        <h3>Configuração padrão</h3>
        <p class="muted">Usada nos uploads do painel e na ferramenta abaixo.</p>
        <label>Proporção padrão<select name="aspect">${aspects}</select></label>
        <label>Qualidade WebP <span id="midiaQLabel">${Math.round(s.quality * 100)}%</span>
          <input type="range" name="quality" min="40" max="95" value="${Math.round(s.quality * 100)}">
        </label>
        <label>Largura máxima (px)
          <input type="number" name="maxWidth" min="0" step="50" value="${s.maxWidth}">
        </label>
        <label class="check"><input type="checkbox" name="applyOnUpload" ${s.applyOnUpload ? 'checked' : ''}> Aplicar crop/WebP automaticamente nos uploads</label>
        <p class="muted" style="font-size:.8rem">Sugestões: capas 16:9 · 1600px · 80–85%. Frota 4:3 · 1400px.</p>
        <button type="submit" class="btn btn--primary">Salvar configuração</button>
        <p class="muted" id="midiaSaved" hidden>Configuração salva neste navegador.</p>
      </form>

      <div class="card midia-card">
        <h3>Ferramenta rápida</h3>
        <p class="muted">Importe uma imagem, ajuste o enquadramento e baixe o WebP otimizado.</p>
        <label>Selecionar imagem<input type="file" id="midiaFile" accept="image/*"></label>
        <div id="midiaResult" class="midia-result" hidden>
          <img id="midiaPreview" alt="Resultado">
          <p class="muted" id="midiaMeta"></p>
          <a class="btn btn--primary" id="midiaDownload" download="imagem.webp">Baixar WebP</a>
        </div>
      </div>
    </div>`;

  const form = document.getElementById('midiaSettings') as HTMLFormElement;
  form.querySelector<HTMLInputElement>('[name=quality]')!.addEventListener('input', (e) => {
    document.getElementById('midiaQLabel')!.textContent =
      `${(e.target as HTMLInputElement).value}%`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const next: ImageOptimizeSettings = {
      aspect: String(fd.get('aspect')) as AspectPreset,
      quality: Number(fd.get('quality')) / 100,
      maxWidth: Number(fd.get('maxWidth') || 0),
      applyOnUpload: fd.get('applyOnUpload') === 'on'
    };
    saveImageSettings(next);
    const msg = document.getElementById('midiaSaved')!;
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; }, 2500);
  });

  document.getElementById('midiaFile')!.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const optimized = await openImageCropper(file);
    if (!optimized) return;
    const url = URL.createObjectURL(optimized);
    const box = document.getElementById('midiaResult')!;
    const preview = document.getElementById('midiaPreview') as HTMLImageElement;
    const meta = document.getElementById('midiaMeta')!;
    const dl = document.getElementById('midiaDownload') as HTMLAnchorElement;
    preview.src = url;
    meta.textContent = `${file.name} (${formatBytes(file.size)}) → ${optimized.name} (${formatBytes(optimized.size)})`;
    dl.href = url;
    dl.download = optimized.name;
    box.hidden = false;
  });
}

/* ==================== BOOTSTRAP ---------------- */
if (supabaseConfigError) {
  app.innerHTML = `<div class="auth"><div class="card auth__card"><h1>Configuração incompleta</h1><p class="error">${esc(supabaseConfigError)}</p></div></div>`;
} else {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      setSessionUser(session?.user ?? null);
      return;
    }
    if (session) void renderShell();
    else {
      didRefreshRole = false;
      setSessionUser(null);
      renderLogin();
    }
  });

  (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) void renderShell();
      else renderLogin();
    } catch (err) {
      app.innerHTML = `<div class="auth"><div class="card auth__card"><h1>Erro ao iniciar</h1><p class="error">${esc((err as Error).message)}</p></div></div>`;
    }
  })();
}
