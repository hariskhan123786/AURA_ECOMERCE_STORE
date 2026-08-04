/**
 * CanvasRenderer.ts
 *
 * Manages a single <canvas> element for rendering the frame sequence.
 * Features:
 *  - Retina / HiDPI support via devicePixelRatio
 *  - Letterbox to maintain source aspect ratio
 *  - Optional motion-blur via alpha-blended prev frame ghost
 *  - Resize observer for responsive canvas
 */

// ─── TYPES ────────────────────────────────────────────────────────
export interface DrawRect {
  sx: number; sy: number; sw: number; sh: number; // source crop
  dx: number; dy: number; dw: number; dh: number; // dest on canvas
}

export interface RendererOptions {
  motionBlur?: boolean;       // enable ghost frame overlay
  motionBlurAlpha?: number;   // opacity of ghost (default 0.12)
}

// ─── RENDERER CLASS ───────────────────────────────────────────────
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private sourceAspect: number = 16 / 9; // overridden after first frame
  private drawRect: DrawRect | null = null;
  private resizeObs: ResizeObserver | null = null;
  private prevBitmap: ImageBitmap | null = null;
  private opts: Required<RendererOptions>;

  constructor(canvas: HTMLCanvasElement, options: RendererOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', {
      alpha: false,               // no transparency needed, faster
      desynchronized: true,       // low latency GPU path
      willReadFrequently: false,
    });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x
    this.opts = {
      motionBlur: options.motionBlur ?? true,
      motionBlurAlpha: options.motionBlurAlpha ?? 0.12,
    };

    this._attachResizeObserver();
    this._resize();
  }

  // ─── RESIZE ──────────────────────────────────────────────────
  private _attachResizeObserver() {
    this.resizeObs = new ResizeObserver(() => this._resize());
    this.resizeObs.observe(this.canvas.parentElement ?? document.body);
  }

  private _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width  = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);
    this.drawRect = this._calcDrawRect(w, h);

    // Redraw the previous frame to prevent canvas clearing on resize!
    if (this.prevBitmap) {
      this.draw(this.prevBitmap);
    }
  }

  /** Calculate letterbox draw rect to maintain source aspect ratio */
  private _calcDrawRect(canvasW: number, canvasH: number): DrawRect {
    const canvasAspect = canvasW / canvasH;
    let dw: number, dh: number, dx: number, dy: number;

    if (canvasAspect > this.sourceAspect) {
      // Canvas is wider than video aspect — fit height (pillarbox left/right)
      dh = canvasH;
      dw = canvasH * this.sourceAspect;
      dx = (canvasW - dw) / 2;
      dy = 0;
    } else {
      // Canvas is taller than video aspect — fit width (letterbox top/bottom)
      dw = canvasW;
      dh = canvasW / this.sourceAspect;
      dx = 0;
      dy = (canvasH - dh) / 2;
    }

    return { sx: 0, sy: 0, sw: 0, sh: 0, dx, dy, dw, dh };
  }

  // ─── DRAW ─────────────────────────────────────────────────────
  draw(bitmap: ImageBitmap) {
    const { ctx, opts } = this;
    const cw = this.canvas.width  / this.dpr;
    const ch = this.canvas.height / this.dpr;

    // Update source aspect from actual bitmap
    if (bitmap.width > 0 && bitmap.height > 0) {
      const newAspect = bitmap.width / bitmap.height;
      if (Math.abs(newAspect - this.sourceAspect) > 0.01) {
        this.sourceAspect = newAspect;
        this.drawRect = this._calcDrawRect(cw, ch);
      }
    }

    const r = this.drawRect ?? this._calcDrawRect(cw, ch);

    // Fill background black (covers letterbox bars)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    // Motion blur ghost: draw previous frame at low alpha
    if (opts.motionBlur && this.prevBitmap) {
      ctx.globalAlpha = opts.motionBlurAlpha;
      ctx.drawImage(this.prevBitmap, r.dx, r.dy, r.dw, r.dh);
      ctx.globalAlpha = 1.0;
    }

    // Draw current frame
    ctx.drawImage(bitmap, r.dx, r.dy, r.dw, r.dh);

    this.prevBitmap = bitmap;
  }

  // ─── CLEAR ────────────────────────────────────────────────────
  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
  }

  // ─── PUBLIC GETTERS ───────────────────────────────────────────
  get width()  { return this.canvas.width  / this.dpr; }
  get height() { return this.canvas.height / this.dpr; }

  // ─── CLEANUP ─────────────────────────────────────────────────
  destroy() {
    this.resizeObs?.disconnect();
    this.prevBitmap = null;
  }
}
