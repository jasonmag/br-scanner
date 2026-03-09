import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { ScanResult } from "@/types/scanner";

export class ZXingFallbackEngine implements DetectionEngine {
  name = "fallback";

  isAvailable(): boolean {
    return true;
  }

  async detect(_input: ImageBitmap | HTMLCanvasElement | ImageData): Promise<ScanResult[]> {
    return [];
  }
}
