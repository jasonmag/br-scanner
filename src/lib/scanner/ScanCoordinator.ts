import { CanvasPool } from "@/lib/scanner/utils/canvasPool";
import { getCenterRoi } from "@/lib/scanner/heuristics/roi";
import { NativeBarcodeDetectorEngine } from "@/lib/scanner/engines/NativeBarcodeDetectorEngine";
import { ServerDecodeEngine } from "@/lib/scanner/engines/ServerDecodeEngine";
import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { ScanResult, ScannerConfig } from "@/types/scanner";

export class ScanCoordinator {
  private readonly rawCanvasPool = new CanvasPool();
  private readonly engines: DetectionEngine[];

  constructor(private readonly config: ScannerConfig) {
    const nativeEngine = new NativeBarcodeDetectorEngine();
    const serverEngine = new ServerDecodeEngine();
    this.engines = config.preferNativeBarcodeDetector
      ? [nativeEngine, serverEngine]
      : [serverEngine, nativeEngine];
  }

  async detect(video: HTMLVideoElement, fullFrame = false): Promise<ScanResult[]> {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return [];
    }

    const roi = fullFrame ? null : getCenterRoi(video.videoWidth, video.videoHeight);
    const targetWidth = roi?.width ?? video.videoWidth;
    const targetHeight = roi?.height ?? video.videoHeight;
    const rawCanvas = this.rawCanvasPool.get(targetWidth, targetHeight);
    const context = rawCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return [];
    }

    if (fullFrame || !roi) {
      context.drawImage(video, 0, 0, rawCanvas.width, rawCanvas.height);
    } else {
      context.drawImage(
        video,
        roi.x,
        roi.y,
        roi.width,
        roi.height,
        0,
        0,
        rawCanvas.width,
        rawCanvas.height
      );
    }

    for (const engine of this.engines) {
      if (!(await engine.isAvailable())) {
        continue;
      }

      const results = await engine.detect(rawCanvas);
      if (results.length > 0) {
        return results;
      }
    }

    return [];
  }
}
