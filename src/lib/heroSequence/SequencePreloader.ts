/**
 * SequencePreloader.ts
 *
 * Preloads frames progressively in background batches.
 */

import { FrameLoader } from './FrameLoader';

const INITIAL_BURST = 24; // Initial frames for fast startup
const IDLE_CHUNK = 8;     // Frames to preload per idle step

export type ProgressCallback = (loaded: number, total: number) => void;

export class SequencePreloader {
  private loader: FrameLoader;
  private totalFrames: number = 0;
  private loadedCount: number = 0;
  private onProgress: ProgressCallback | null = null;
  private idleHandle: number | null = null;
  private currentIndex: number = 0;
  private initialBurstDone: boolean = false;

  constructor(loader: FrameLoader) {
    this.loader = loader;
  }

  async init(onProgress?: ProgressCallback): Promise<void> {
    if (onProgress) this.onProgress = onProgress;

    await this.loader.loadManifest();
    this.totalFrames = this.loader.totalFrames;

    if (this.totalFrames === 0) {
      this.totalFrames = 192;
    }

    // Load initial burst
    await this._loadInitialBurst();
    this.initialBurstDone = true;

    // Start background preloader
    this._scheduleIdleLoad();
  }

  private async _loadInitialBurst(): Promise<void> {
    const burst = Math.min(INITIAL_BURST, this.totalFrames);
    const tasks: Promise<void>[] = [];

    for (let i = 0; i < burst; i++) {
      tasks.push(
        this.loader.loadFrame(i).then(() => {
          this.loadedCount++;
          this.onProgress?.(this.loadedCount, burst);
        }).catch(() => {
          this.loadedCount++;
          this.onProgress?.(this.loadedCount, burst);
        })
      );
    }
    await Promise.all(tasks);
  }

  private _scheduleIdleLoad() {
    if (this.idleHandle !== null) return;

    const runChunk = () => {
      let loadedInBatch = 0;

      // Preload ahead and behind cursor
      for (let offset = 1; offset < this.totalFrames; offset++) {
        const ahead = this.currentIndex + offset;
        const behind = this.currentIndex - offset;

        if (ahead < this.totalFrames) {
          this.loader.prefetch(ahead);
          loadedInBatch++;
          if (loadedInBatch >= IDLE_CHUNK) break;
        }
        if (behind >= 0) {
          this.loader.prefetch(behind);
          loadedInBatch++;
          if (loadedInBatch >= IDLE_CHUNK) break;
        }
      }

      if (this.idleHandle !== null) {
        this.idleHandle = window.setTimeout(runChunk, 150) as unknown as number;
      }
    };

    this.idleHandle = window.setTimeout(runChunk, 100) as unknown as number;
  }

  updateCursor(index: number) {
    this.currentIndex = index;
    // Immediately prefetch nearby frames
    for (let i = index; i <= Math.min(this.totalFrames - 1, index + 10); i++) {
      this.loader.prefetch(i);
    }
    for (let i = Math.max(0, index - 5); i < index; i++) {
      this.loader.prefetch(i);
    }
  }

  get progress(): number {
    if (this.totalFrames === 0) return 0;
    return this.loadedCount / this.totalFrames;
  }

  get isInitialBurstComplete(): boolean {
    return this.initialBurstDone;
  }

  destroy() {
    if (this.idleHandle !== null) {
      clearTimeout(this.idleHandle);
      this.idleHandle = null;
    }
    this.loader.destroy();
  }
}
