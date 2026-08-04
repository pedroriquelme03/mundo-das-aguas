// Cropper.js v1 — API com getCroppedCanvas (não usar v2)
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const STORAGE_KEY = 'mda_image_optimize_settings';

export type AspectPreset = 'livre' | '16:9' | '4:3' | '1:1' | '3:2';

export interface ImageOptimizeSettings {
  quality: number;
  maxWidth: number;
  aspect: AspectPreset;
  applyOnUpload: boolean;
}

export const DEFAULT_SETTINGS: ImageOptimizeSettings = {
  quality: 0.82,
  maxWidth: 1600,
  aspect: '16:9',
  applyOnUpload: true
};

export const ASPECT_VALUES: Record<AspectPreset, number> = {
  livre: NaN,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '3:2': 3 / 2
};

export const ASPECT_HINTS: Record<AspectPreset, string> = {
  livre: 'Sem proporção fixa',
  '16:9': 'Capas, blog e hero',
  '4:3': 'Frota e galerias',
  '1:1': 'Thumbnails / redes',
  '3:2': 'Fotos gerais'
};

export function loadImageSettings(): ImageOptimizeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ImageOptimizeSettings>;
    return {
      quality: clamp(Number(parsed.quality ?? DEFAULT_SETTINGS.quality), 0.4, 0.95),
      maxWidth: Math.max(0, Number(parsed.maxWidth ?? DEFAULT_SETTINGS.maxWidth)),
      aspect: ((parsed.aspect && parsed.aspect in ASPECT_VALUES)
        ? parsed.aspect
        : DEFAULT_SETTINGS.aspect) as AspectPreset,
      applyOnUpload: parsed.applyOnUpload !== false
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveImageSettings(settings: ImageOptimizeSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao converter para WebP. Use Chrome, Edge ou Firefox.'));
      },
      'image/webp',
      quality
    );
  });
}

function scaleCanvas(source: HTMLCanvasElement, maxWidth: number): HTMLCanvasElement {
  if (!maxWidth || source.width <= maxWidth) return source;
  const ratio = maxWidth / source.width;
  const out = document.createElement('canvas');
  out.width = Math.round(source.width * ratio);
  out.height = Math.round(source.height * ratio);
  const ctx = out.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

function aspectRatioFromKey(key: AspectPreset): number {
  const v = ASPECT_VALUES[key];
  return Number.isFinite(v) ? v : NaN;
}

/**
 * Abre modal de crop e devolve um File .webp otimizado, ou null se cancelar.
 */
export function openImageCropper(
  file: File,
  overrides?: Partial<ImageOptimizeSettings>
): Promise<File | null> {
  const settings = { ...loadImageSettings(), ...overrides };

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const host = document.createElement('div');
    host.className = 'imgopt-overlay';
    host.innerHTML = `
      <div class="imgopt-modal card" role="dialog" aria-modal="true" aria-label="Otimizar imagem">
        <div class="imgopt-modal__head">
          <h3>Recortar e otimizar</h3>
          <p class="muted">${escapeHtml(file.name)} · original ${formatBytes(file.size)}</p>
        </div>
        <div class="imgopt-stage" id="imgoptStage">
          <img id="imgoptSource" alt="Pré-visualização" src="${objectUrl}">
        </div>
        <div class="imgopt-controls">
          <label>Proporção
            <select id="imgoptAspect">
              ${(Object.keys(ASPECT_VALUES) as AspectPreset[]).map((k) =>
                `<option value="${k}" ${k === settings.aspect ? 'selected' : ''}>${k} — ${ASPECT_HINTS[k]}</option>`
              ).join('')}
            </select>
          </label>
          <label>Qualidade <span id="imgoptQualityVal">${Math.round(settings.quality * 100)}%</span>
            <input type="range" id="imgoptQuality" min="40" max="95" step="1" value="${Math.round(settings.quality * 100)}">
          </label>
          <label>Largura máx. (px)
            <input type="number" id="imgoptMaxW" min="0" step="50" value="${settings.maxWidth}" placeholder="0 = original">
          </label>
        </div>
        <div class="imgopt-info" id="imgoptInfo">
          <span>Formato de saída: <strong>WebP</strong></span>
          <span class="muted">Ajuste o enquadramento e clique em Inserir imagem.</span>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" id="imgoptCancel">Cancelar</button>
          <button type="button" class="btn btn--primary" id="imgoptApply">Inserir imagem</button>
        </div>
      </div>`;

    document.body.appendChild(host);

    const img = host.querySelector('#imgoptSource') as HTMLImageElement;
    const aspectSelect = host.querySelector('#imgoptAspect') as HTMLSelectElement;
    let cropper: Cropper | null = null;

    const cleanup = (result: File | null) => {
      cropper?.destroy();
      cropper = null;
      URL.revokeObjectURL(objectUrl);
      host.remove();
      resolve(result);
    };

    const start = () => {
      const ratio = aspectRatioFromKey(aspectSelect.value as AspectPreset);
      cropper = new Cropper(img, {
        viewMode: 1,
        dragMode: 'crop',
        autoCropArea: 1,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        background: false,
        modal: true,
        aspectRatio: ratio,
        ready: () => {
          cropper?.crop();
        }
      });
    };

    if (img.complete && img.naturalWidth > 0) start();
    else img.addEventListener('load', start, { once: true });

    aspectSelect.addEventListener('change', () => {
      if (!cropper) return;
      cropper.setAspectRatio(aspectRatioFromKey(aspectSelect.value as AspectPreset));
    });

    host.querySelector('#imgoptQuality')!.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      host.querySelector('#imgoptQualityVal')!.textContent = `${v}%`;
    });

    host.querySelector('#imgoptCancel')!.addEventListener('click', () => cleanup(null));
    host.addEventListener('click', (e) => {
      if (e.target === host) cleanup(null);
    });

    host.querySelector('#imgoptApply')!.addEventListener('click', async () => {
      if (!cropper) return;
      const btn = host.querySelector('#imgoptApply') as HTMLButtonElement;
      const info = host.querySelector('#imgoptInfo') as HTMLElement;
      btn.disabled = true;
      btn.textContent = 'Processando…';
      try {
        const quality = Number((host.querySelector('#imgoptQuality') as HTMLInputElement).value) / 100;
        const maxWidth = Number((host.querySelector('#imgoptMaxW') as HTMLInputElement).value) || 0;
        if (typeof cropper.getCroppedCanvas !== 'function') {
          throw new Error('Cropper inválido (reinicie o servidor do admin e recarregue a página).');
        }
        let canvas = cropper.getCroppedCanvas({
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
          fillColor: '#fff'
        });
        if (!canvas) throw new Error('Não foi possível gerar o recorte.');
        canvas = scaleCanvas(canvas, maxWidth);
        const blob = await canvasToWebpBlob(canvas, quality);
        const base = file.name.replace(/\.[^.]+$/, '') || 'imagem';
        const out = new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
        info.innerHTML =
          `<span>Convertido para <strong>WebP</strong>: ${formatBytes(file.size)} → <strong>${formatBytes(out.size)}</strong> · ${canvas.width}×${canvas.height}px</span>`;
        // breve feedback visual antes de fechar
        await new Promise((r) => setTimeout(r, 280));
        cleanup(out);
      } catch (err) {
        info.innerHTML = `<span class="error">Erro: ${escapeHtml((err as Error).message)}</span>`;
        btn.disabled = false;
        btn.textContent = 'Inserir imagem';
      }
    });
  });
}

export async function maybeOptimizeForUpload(file: File): Promise<File | null> {
  const settings = loadImageSettings();
  if (!settings.applyOnUpload) return file;
  if (!file.type.startsWith('image/')) return file;
  return openImageCropper(file);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
