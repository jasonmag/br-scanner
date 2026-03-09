import { ScanCoordinator } from "@/lib/scanner/ScanCoordinator";
import { createScanSession } from "@/lib/scanner/ScanSession";
import { computeScanInterval } from "@/lib/scanner/utils/timing";
import { shouldSuppressDuplicate } from "@/lib/scanner/utils/dedupe";
import type { ScanResult, ScannerConfig } from "@/types/scanner";

interface ScanLoopOptions {
  config: ScannerConfig;
  onResult: (result: ScanResult, stats: { durationMs: number }) => void;
  onState: (state: {
    statusMessage: string;
    activeEngine: ScanResult["source"] | null;
    attemptsPerSecond: number;
    lastScanDurationMs: number | null;
  }) => void;
}

export class ScanLoop {
  private readonly coordinator: ScanCoordinator;
  private readonly session = createScanSession();
  private timer: number | null = null;
  private running = false;
  private busy = false;
  private video: HTMLVideoElement | null = null;
  private attemptsThisSecond = 0;
  private secondWindowStartedAt = 0;

  constructor(private readonly options: ScanLoopOptions) {
    this.coordinator = new ScanCoordinator(options.config);
  }

  start(video: HTMLVideoElement) {
    this.stop();
    this.video = video;
    this.running = true;
    this.secondWindowStartedAt = performance.now();
    this.scheduleNext();
  }

  pause() {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resume() {
    if (!this.video || this.running) {
      return;
    }

    this.running = true;
    this.scheduleNext();
  }

  stop() {
    this.pause();
    this.video = null;
  }

  async scanOnce() {
    if (!this.video || this.busy) {
      return;
    }

    const wasRunning = this.running;
    this.pause();

    try {
      await this.tick(false, true);
    } finally {
      if (wasRunning) {
        this.running = true;
        this.scheduleNext();
      }
    }
  }

  private scheduleNext() {
    if (!this.running) {
      return;
    }

    const interval = computeScanInterval(this.options.config.targetScansPerSecond);
    this.timer = window.setTimeout(() => void this.tick(), interval);
  }

  private async tick(scheduleNext = true, forceFullFrame = false) {
    if ((!this.running && scheduleNext) || !this.video || this.busy) {
      if (scheduleNext) {
        this.scheduleNext();
      }
      return;
    }

    this.busy = true;
    const startedAt = performance.now();

    try {
      const fullFrame =
        forceFullFrame || (this.session.failedRoiAttempts > 0 && this.session.failedRoiAttempts % 2 === 0);
      const results = await this.coordinator.detect(this.video, fullFrame);
      const durationMs = performance.now() - startedAt;
      this.recordAttempt(durationMs);

      const acceptedResult = results.find(
        (result) =>
          !shouldSuppressDuplicate(
            this.session.lastAcceptedResult,
            result.rawValue,
            result.timestamp,
            this.options.config.duplicateCooldownMs
          )
      );

      if (acceptedResult) {
        this.session.lastAcceptedResult = {
          value: acceptedResult.rawValue,
          timestamp: acceptedResult.timestamp
        };
        this.session.failedRoiAttempts = 0;
        this.options.onState({
          statusMessage: "Barcode detected",
          activeEngine: acceptedResult.source,
          attemptsPerSecond: this.attemptsThisSecond,
          lastScanDurationMs: durationMs
        });
        this.options.onResult(acceptedResult, { durationMs });

        if (this.options.config.stopOnSuccess && !this.options.config.continuous) {
          this.pause();
          return;
        }
      } else {
        this.session.failedRoiAttempts += 1;
        this.options.onState({
          statusMessage: fullFrame ? "Searching the full frame..." : "Center the barcode and tap Scan again.",
          activeEngine: null,
          attemptsPerSecond: this.attemptsThisSecond,
          lastScanDurationMs: durationMs
        });
      }
    } finally {
      this.busy = false;
      if (scheduleNext) {
        this.scheduleNext();
      }
    }
  }

  private recordAttempt(durationMs: number) {
    const now = performance.now();
    if (now - this.secondWindowStartedAt >= 1000) {
      this.attemptsThisSecond = 0;
      this.secondWindowStartedAt = now;
    }

    this.attemptsThisSecond += 1;
    this.options.onState({
      statusMessage: durationMs > 140 ? "Hold steady, then tap Scan again." : "Center the barcode in the frame, then tap Scan.",
      activeEngine: null,
      attemptsPerSecond: this.attemptsThisSecond,
      lastScanDurationMs: durationMs
    });
  }
}
