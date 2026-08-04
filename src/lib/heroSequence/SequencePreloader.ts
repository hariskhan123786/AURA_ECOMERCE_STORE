/**
 * SequencePreloader.ts
 *
 * Progressively preloads frames in a sliding window around the
 * current playback position. Uses requestIdleCallback for
 * background loading so it never blocks the main thread.
 */

import { FrameLoader } from './FrameLoader';

// ─── CONFIGURATION ────────────────────────────────────────────────
const INITIAL_BURST   = 24;   // frames to eagerly load on init
const WINDOW_AHEAD    = 15;   // frames to preload ahead of current
const WINDOW_BEHIND   = 8;    // frames to keep behind current
const IDLE_CHUNK      = 6;    // frames per idle callback batch

// ─── TYPES ────────────────────────────────────────────────────────
export type ProgressCallback = (loaded: number, total: number) => void;

// ─── PRELOADER CLASS ──────────────────────────────────────────────
export class SequencePreloader {
  private loader: FrameLoader;
  private totalFrames: number = 0;
  private loadedCount: number = 0;
  private onProgress: ProgressCallback | null = null;
  private idleHandle: number | null = null;
  private currentIndex: number = 0;
  private initialBurstDone: boolean = false;
  private initialBurstPromise: Promise<void> | null = null;

  constructor(loader: FrameLoader) {
    this.loader = loader;
  }

  // ─── INIT ────────────────────────────────────────────────────
  async init(onProgress?: ProgressCallback): Promise<void> {
    if (onProgress) this.onProgress = onProgress;

    await this.loader.loadManifest();
    this.totalFrames = this.loader.totalFrames;

    if (this.totalFrames === 0) {
      console.warn('[SequencePreloader] No frames found in manifest');
      return;
    }

    // Eagerly load the initial burst (first N frames)
    this.initialBurstPromise = this._loadInitialBurst();
    await this.initialBurstPromise;

    this.initialBurstDone = true;

    // Start idle background loading
    this._scheduleIdleLoad();
  }

  // ─── INITIAL BURST ────────────────────────────────────────────
  private async _loadInitialBurst(): Promise<void> {
    const burst = Math.min(INITIAL_BURST, this.totalFrames);
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < burst; i++) {
      tasks.push(
        this.loader.loadFrame(i).then(() => {
          this.loadedCount++;
          this.onProgress?.(this.loadedCount, this.totalFrames);
        }).catch(() => {})
      );
    }
    await Promise.all(tasks);
  }

  // ─── IDLE BACKGROUND LOADER ───────────────────────────────────
  private _scheduleIdleLoad() {
    if (this.idleHandle !== null) return;

    const scheduleNext = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        this.idleHandle = requestIdleCallback(
          (deadline) => {
            this.idleHandle = null;
            this._processIdleChunk(deadline.timeRemaining());
            if (this.loadedCount < this.totalFrames) {
              scheduleNext();
            }
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback: setTimeout
        this.idleHandle = window.setTimeout(() => {
          this.idleHandle = null;
          this._processIdleChunk(16);
          if (this.loadedCount < this.totalFrames) {
            scheduleNext();
          }
        }, 100) as unknown as number;
      }
    };

    scheduleNext();
  }

  private _processIdleChunk(timeRemaining: number) {
    // Fill from current window outward, then fill rest sequentially
    const start = Math.max(0, this.currentIndex - WINDOW_BEHIND);
    const end   = Math.min(this.totalFrames - 1, this.currentIndex + WINDOW_AHEAD);

    let loaded = 0;
    for (let i = start; i <= end && loaded < IDLE_CHUNK && timeRemaining > 2; i++) {
      this.loader.prefetch(i);
      loaded++;
    }
  }

  // ─── CURSOR UPDATE ────────────────────────────────────────────
  /** Call this when the current frame index changes (from scroll) */
  updateCursor(index: number) {
    this.currentIndex = index;

    if (!this.initialBurstDone) return;

    // Immediate sync preload for the next few frames
    const urgentAhead = 5;
    for (let i = index; i <= Math.min(this.totalFrames - 1, index + urgentAhead); i++) {
      this.loader.prefetch(i);
    }

    // Evict frames outside the memory window
    const evictStart = Math.max(0, index - WINDOW_BEHIND - 5);
    const evictEnd   = Math.min(this.totalFrames - 1, index + WINDOW_AHEAD + 5);
    this.loader.evictOutside(evictStart, evictEnd);
  }

  // ─── PUBLIC GETTERS ───────────────────────────────────────────
  get progress(): number {
    if (this.totalFrames === 0) return 0;
    return this.loadedCount / this.totalFrames;
  }

  get isInitialBurstComplete(): boolean {
    return this.initialBurstDone;
  }

  // ─── CLEANUP ─────────────────────────────────────────────────
  destroy() {
    if (this.idleHandle !== null) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(this.idleHandle);
      } else {
        clearTimeout(this.idleHandle);
      }
      this.idleHandle = null;
    }
    this.loader.destroy();
  }
}
