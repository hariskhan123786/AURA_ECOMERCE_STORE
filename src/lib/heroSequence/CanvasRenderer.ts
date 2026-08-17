/**
 * CanvasRenderer.ts
 *
 * Manages a single <canvas> element for rendering the frame sequence.
 * Features:
 *  - Retina / HiDPI support via devicePixelRatio
 *  - Letterbox to maintain source aspect ratio
 *  - Safe try/catch draw with dimension checks
 *  - ResizeObserver for dynamic viewport responsiveness
 */

export interface DrawRect {
  sx: number; sy: number; sw: number; sh: number;
  dx: number; dy: number; dw: number; dh: number;
}

export interface RendererOptions {
  motionBlur?: boolean;
  motionBlurAlpha?: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private sourceAspect: number = 16 / 9;
  private drawRect: DrawRect | null = null;
  private resizeObs: ResizeObserver | null = null;
  private currentSource: CanvasImageSource | null = null;

  constructor(canvas: HTMLCanvasElement, _options: RendererOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    this._attachResizeObserver();
    this._resize();
  }

  // ─── RESIZE ──────────────────────────────────────────────────
  private _attachResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => this._resize());
      this.resizeObs.observe(this.canvas.parentElement ?? document.body);
    }
  }

  private _resize() {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 720;
    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width  = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
    this.drawRect = this._calcDrawRect(w, h);

    if (this.currentSource) {
      this.draw(this.currentSource);
    }
  }

  /** Calculate letterbox draw rect to maintain source aspect ratio */
  private _calcDrawRect(canvasW: number, canvasH: number): DrawRect {
    const canvasAspect = canvasW / canvasH;
    let dw: number, dh: number, dx: number, dy: number;

    if (canvasAspect > this.sourceAspect) {
      // Fit height (pillarbox)
      dh = canvasH;
      dw = canvasH * this.sourceAspect;
      dx = (canvasW - dw) / 2;
      dy = 0;
    } else {
      // Fit width (letterbox)
      dw = canvasW;
      dh = canvasW / this.sourceAspect;
      dx = 0;
      dy = (canvasH - dh) / 2;
    }

    return { sx: 0, sy: 0, sw: 0, sh: 0, dx, dy, dw, dh };
  }

  // ─── DRAW ─────────────────────────────────────────────────────
  draw(source: CanvasImageSource) {
    if (!source) return;
    try {
      const cw = this.canvas.width  / this.dpr;
      const ch = this.canvas.height / this.dpr;

      let sw = 0;
      let sh = 0;
      if ('naturalWidth' in source && (source as HTMLImageElement).naturalWidth) {
        sw = (source as HTMLImageElement).naturalWidth;
        sh = (source as HTMLImageElement).naturalHeight;
      } else if ('videoWidth' in source && (source as HTMLVideoElement).videoWidth) {
        sw = (source as HTMLVideoElement).videoWidth;
        sh = (source as HTMLVideoElement).videoHeight;
      } else if ('width' in source && (source as ImageBitmap).width) {
        sw = (source as ImageBitmap).width;
        sh = (source as ImageBitmap).height;
      }

      if (sw > 0 && sh > 0) {
        const newAspect = sw / sh;
        if (Math.abs(newAspect - this.sourceAspect) > 0.01) {
          this.sourceAspect = newAspect;
          this.drawRect = this._calcDrawRect(cw, ch);
        }
      }

      const r = this.drawRect ?? this._calcDrawRect(cw, ch);

      // Fill background black
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, cw, ch);

      // Draw current frame safely
      this.ctx.drawImage(source, r.dx, r.dy, r.dw, r.dh);
      this.currentSource = source;
    } catch (err) {
      console.warn('[CanvasRenderer] draw error suppressed:', err);
    }
  }

  // ─── CLEAR ────────────────────────────────────────────────────
  clear(color = '#000') {
    try {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    } catch {}
  }

  // ─── PUBLIC GETTERS ───────────────────────────────────────────
  get width()  { return this.canvas.width  / this.dpr; }
  get height() { return this.canvas.height / this.dpr; }

  // ─── CLEANUP ─────────────────────────────────────────────────
  destroy() {
    this.resizeObs?.disconnect();
    this.currentSource = null;
  }
}
