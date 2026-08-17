/**
 * FrameLoader.ts
 *
 * Loads video frames as HTMLImageElement / ImageBitmap objects.
 * Uses memory-safe caching and async decoding to ensure zero detachment crashes.
 */

// ─── TYPES ────────────────────────────────────────────────────────
export interface SequenceManifest {
  version: number;
  generatedAt: string;
  video: { source: string; duration: number };
  desktop: { totalFrames: number; fps: number; width: number; height: number; pattern: string; ext: string };
  mobile:  { totalFrames: number; fps: number; width: number; height: number; pattern: string; ext: string };
}

export type FrameVariant = 'desktop' | 'mobile';
export type FrameSource = CanvasImageSource;

// ─── CONSTANTS ────────────────────────────────────────────────────
const BASE_PATH = '/hero-sequence';

// ─── FRAME LOADER CLASS ───────────────────────────────────────────
export class FrameLoader {
  private manifest: SequenceManifest | null = null;
  private cache = new Map<number, FrameSource>();
  private pending = new Map<number, Promise<FrameSource>>();
  private variant: FrameVariant;

  constructor(variant: FrameVariant = 'desktop') {
    this.variant = variant;
  }

  // ─── MANIFEST ──────────────────────────────────────────────────
  async loadManifest(): Promise<SequenceManifest> {
    if (this.manifest) return this.manifest;
    try {
      const res = await fetch(`${BASE_PATH}/manifest.json`);
      if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
      const text = await res.text();
      // Strip BOM if present
      const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
      this.manifest = JSON.parse(cleanText) as SequenceManifest;
      return this.manifest;
    } catch (e) {
      console.warn('[FrameLoader] Fallback manifest used:', e);
      this.manifest = {
        version: 1,
        generatedAt: '1',
        video: { source: 'fallback', duration: 8 },
        desktop: { totalFrames: 192, fps: 24, width: 1280, height: 720, pattern: 'desktop/frame%04d.jpg', ext: 'jpg' },
        mobile: { totalFrames: 192, fps: 24, width: 720, height: 1280, pattern: 'mobile/frame%04d.jpg', ext: 'jpg' },
      };
      return this.manifest;
    }
  }

  get totalFrames(): number {
    if (!this.manifest) return 192;
    return this.variant === 'mobile'
      ? (this.manifest.mobile?.totalFrames ?? 192)
      : (this.manifest.desktop?.totalFrames ?? 192);
  }

  // ─── URL BUILDING ──────────────────────────────────────────────
  getFrameUrl(index: number): string {
    const num = String(Math.max(1, index + 1)).padStart(4, '0');
    const ext = this.variant === 'mobile'
      ? (this.manifest?.mobile?.ext ?? 'jpg')
      : (this.manifest?.desktop?.ext ?? 'jpg');
    return `${BASE_PATH}/${this.variant}/frame${num}.${ext}`;
  }

  // ─── CORE LOAD ─────────────────────────────────────────────────
  async loadFrame(index: number): Promise<FrameSource> {
    const cached = this.cache.get(index);
    if (cached) return cached;

    const inFlight = this.pending.get(index);
    if (inFlight) return inFlight;

    const promise = this._fetchImage(index);
    this.pending.set(index, promise);
    try {
      const source = await promise;
      this.cache.set(index, source);
      return source;
    } finally {
      this.pending.delete(index);
    }
  }

  private _fetchImage(index: number): Promise<FrameSource> {
    return new Promise((resolve, reject) => {
      const url = this.getFrameUrl(index);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';

      img.onload = () => {
        if (typeof createImageBitmap !== 'undefined') {
          createImageBitmap(img)
            .then(resolve)
            .catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load frame ${index} from ${url}`));
      };

      img.src = url;
    });
  }

  // ─── PRELOAD SINGLE FRAME ─────────────────────────────────────
  prefetch(index: number): void {
    if (index < 0 || index >= this.totalFrames) return;
    if (this.cache.has(index) || this.pending.has(index)) return;
    this.loadFrame(index).catch(() => {});
  }

  // ─── CLEANUP ───────────────────────────────────────────────────
  destroy() {
    this.cache.clear();
    this.pending.clear();
  }
}
