import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { BarcodeFormatName, ScanResult } from "@/types/scanner";

const SUPPORTED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "qr_code",
  "data_matrix"
];

function normalizeFormat(format?: string): BarcodeFormatName {
  if (!format) {
    return "unknown";
  }

  return (SUPPORTED_FORMATS.includes(format) ? format : "unknown") as BarcodeFormatName;
}

export class NativeBarcodeDetectorEngine implements DetectionEngine {
  name = "native";

  private detector: BarcodeDetector | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.BarcodeDetector !== "undefined";
  }

  async detect(input: ImageBitmap | HTMLCanvasElement): Promise<ScanResult[]> {
    const BarcodeDetectorApi = window.BarcodeDetector;
    if (!BarcodeDetectorApi) {
      return [];
    }

    if (!this.detector) {
      this.detector = new BarcodeDetectorApi({
        formats: SUPPORTED_FORMATS
      });
    }

    const results = await this.detector.detect(input);
    const timestamp = Date.now();

    return results
      .filter((result) => !!result.rawValue)
      .map((result) => ({
        rawValue: result.rawValue ?? "",
        format: normalizeFormat(result.format),
        timestamp,
        source: "native",
        boundingBox: result.boundingBox
          ? {
              x: result.boundingBox.x,
              y: result.boundingBox.y,
              width: result.boundingBox.width,
              height: result.boundingBox.height
            }
          : undefined
      }));
  }
}
