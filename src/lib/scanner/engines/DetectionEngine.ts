import type { ScanResult } from "@/types/scanner";

export interface DetectionEngine {
  name: string;
  isAvailable(): Promise<boolean> | boolean;
  detect(input: ImageBitmap | HTMLCanvasElement | ImageData): Promise<ScanResult[]>;
}
