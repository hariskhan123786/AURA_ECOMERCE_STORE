/**
 * FrameLoader.ts
 *
 * Loads video frames as ImageBitmap objects with LRU caching.
 * Uses createImageBitmap() for hardware-accelerated decode.
 * Evicts old frames to keep memory bounded.
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

interface CacheEntry {
  bitmap: ImageBitmap;
  lastUsed: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────
const BASE_PATH    = '/hero-sequence';
const MAX_CACHE    = 40;   // max ImageBitmap objects in RAM
const EVICT_COUNT  = 12;   // how many to evict when cache is full

// ─── FRAME LOADER CLASS ───────────────────────────────────────────
export class FrameLoader {
  private manifest: SequenceManifest | null = null;
  private cache     = new Map<string, CacheEntry>();
  private pending   = new Map<string, Promise<ImageBitmap>>();
  private variant: FrameVariant;
  private supportsImageBitmap: boolean;

  constructor(variant: FrameVariant = 'desktop') {
    this.variant = variant;
    this.supportsImageBitmap = typeof createImageBitmap !== 'undefined';
  }

  // ─── MANIFEST ──────────────────────────────────────────────────
  async loadManifest(): Promise<SequenceManifest> {
    if (this.manifest) return this.manifest;
    const res = await fetch(`${BASE_PATH}/manifest.json`);
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
    this.manifest = await res.json() as SequenceManifest;
    return this.manifest;
  }

  get totalFrames(): number {
    if (!this.manifest) return 0;
    return this.variant === 'mobile'
      ? this.manifest.mobile.totalFrames
      : this.manifest.desktop.totalFrames;
  }

  // ─── URL BUILDING ──────────────────────────────────────────────
  getFrameUrl(index: number): string {
    // Frames are 1-indexed: frame0001.jpg
    const num = String(Math.max(1, index + 1)).padStart(4, '0');
    const ext = this.variant === 'mobile'
      ? (this.manifest?.mobile.ext ?? 'jpg')
      : (this.manifest?.desktop.ext ?? 'jpg');
    // Cache bust query parameter using the manifest's generation timestamp
    const v = this.manifest?.generatedAt ? encodeURIComponent(this.manifest.generatedAt) : '1';
    return `${BASE_PATH}/${this.variant}/frame${num}.${ext}?v=${v}`;
  }

  // ─── CORE LOAD ─────────────────────────────────────────────────
  async loadFrame(index: number): Promise<ImageBitmap> {
    const key = `${this.variant}:${index}`;

    // Cache hit
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.bitmap;
    }

    // Deduplicate concurrent requests for same frame
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    const promise = this._fetchFrame(index, key);
    this.pending.set(key, promise);
    try {
      const bitmap = await promise;
      return bitmap;
    } finally {
      this.pending.delete(key);
    }
  }

  private async _fetchFrame(index: number, key: string): Promise<ImageBitmap> {
    const url = this.getFrameUrl(index);
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Frame ${index} fetch failed: ${res.status}`);
    const blob = await res.blob();

    let bitmap: ImageBitmap;
    if (this.supportsImageBitmap) {
      bitmap = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
    } else {
      // Fallback: wrap in HTMLImageElement as ImageBitmap polyfill
      bitmap = await this._blobToImageBitmap(blob);
    }

    // Store in cache
    this.cache.set(key, { bitmap, lastUsed: Date.now() });
    this._evictIfNeeded();

    return bitmap;
  }

  private _blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        // createImageBitmap from HTMLImageElement always works
        createImageBitmap(img).then(resolve).catch(reject);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  }

  // ─── LRU EVICTION ──────────────────────────────────────────────
  private _evictIfNeeded() {
    if (this.cache.size <= MAX_CACHE) return;

    // Sort by lastUsed ascending (oldest first)
    const entries = [...this.cache.entries()].sort(
      ([, a], [, b]) => a.lastUsed - b.lastUsed
    );

    // Evict oldest EVICT_COUNT entries
    for (let i = 0; i < EVICT_COUNT && i < entries.length; i++) {
      const [key, entry] = entries[i];
      entry.bitmap.close(); // release GPU memory
      this.cache.delete(key);
    }
  }

  // ─── EXPLICIT EVICT RANGE ──────────────────────────────────────
  /** Evict frames outside the [keepStart, keepEnd] window */
  evictOutside(keepStart: number, keepEnd: number) {
    for (const [key, entry] of this.cache.entries()) {
      const parts = key.split(':');
      const idx = parseInt(parts[1], 10);
      if (idx < keepStart || idx > keepEnd) {
        entry.bitmap.close();
        this.cache.delete(key);
      }
    }
  }

  // ─── PRELOAD SINGLE FRAME (fire-and-forget) ────────────────────
  prefetch(index: number): void {
    if (index < 0 || index >= this.totalFrames) return;
    const key = `${this.variant}:${index}`;
    if (this.cache.has(key) || this.pending.has(key)) return;
    this.loadFrame(index).catch(() => { /* silent */ });
  }

  // ─── CLEANUP ───────────────────────────────────────────────────
  destroy() {
    for (const entry of this.cache.values()) {
      entry.bitmap.close();
    }
    this.cache.clear();
    this.pending.clear();
  }
}
