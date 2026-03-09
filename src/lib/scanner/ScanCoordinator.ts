import { CanvasPool } from "@/lib/scanner/utils/canvasPool";
import { getCenterRoi } from "@/lib/scanner/heuristics/roi";
import { NativeBarcodeDetectorEngine } from "@/lib/scanner/engines/NativeBarcodeDetectorEngine";
import { OpenCvPreprocessor } from "@/lib/scanner/engines/OpenCvPreprocessor";
import { ZXingFallbackEngine } from "@/lib/scanner/engines/ZXingFallbackEngine";
import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { ScanResult, ScannerConfig } from "@/types/scanner";

export class ScanCoordinator {
  private readonly rawCanvasPool = new CanvasPool();
  private readonly processedCanvasPool = new CanvasPool();
  private readonly preprocessor = new OpenCvPreprocessor();
  private readonly engines: DetectionEngine[];

  constructor(private readonly config: ScannerConfig) {
    this.engines = [new NativeBarcodeDetectorEngine(), new ZXingFallbackEngine()];
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

      const input = engine.name === "native" ? rawCanvas : this.preprocess(rawCanvas);
      const results = await engine.detect(input);
      if (results.length > 0) {
        return results;
      }
    }

    return [];
  }

  private preprocess(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = this.processedCanvasPool.get(source.width, source.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return source;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0);
    return this.preprocessor.preprocess(canvas);
  }
}
