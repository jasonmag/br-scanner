import { CanvasPool } from "@/lib/scanner/utils/canvasPool";
import { getCenterRoi } from "@/lib/scanner/heuristics/roi";
import { NativeBarcodeDetectorEngine } from "@/lib/scanner/engines/NativeBarcodeDetectorEngine";
import { OpenCvPreprocessor } from "@/lib/scanner/engines/OpenCvPreprocessor";
import { ZXingFallbackEngine } from "@/lib/scanner/engines/ZXingFallbackEngine";
import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { ScanResult, ScannerConfig } from "@/types/scanner";

export class ScanCoordinator {
  private readonly canvasPool = new CanvasPool();
  private readonly preprocessor = new OpenCvPreprocessor();
  private readonly engines: DetectionEngine[];

  constructor(private readonly config: ScannerConfig) {
    this.engines = [new NativeBarcodeDetectorEngine(), new ZXingFallbackEngine()];
  }

  async detect(video: HTMLVideoElement, fullFrame = false): Promise<ScanResult[]> {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return [];
    }

    const targetCanvas = this.canvasPool.get(video.videoWidth, video.videoHeight);
    const context = targetCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return [];
    }

    if (fullFrame) {
      context.drawImage(video, 0, 0, targetCanvas.width, targetCanvas.height);
    } else {
      const roi = getCenterRoi(video.videoWidth, video.videoHeight);
      context.drawImage(
        video,
        roi.x,
        roi.y,
        roi.width,
        roi.height,
        0,
        0,
        targetCanvas.width,
        targetCanvas.height
      );
    }

    const preprocessed = this.preprocessor.preprocess(targetCanvas);

    for (const engine of this.engines) {
      if (!(await engine.isAvailable())) {
        continue;
      }

      const results = await engine.detect(preprocessed);
      if (results.length > 0) {
        return results;
      }
    }

    return [];
  }
}
