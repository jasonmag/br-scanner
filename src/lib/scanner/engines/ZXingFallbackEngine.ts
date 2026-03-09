import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import { increaseContrast, rotateCanvas, toImageData } from "@/lib/scanner/utils/imageTransforms";
import type { BarcodeFormatName, ScanResult } from "@/types/scanner";

const ZXING_FORMATS = ["EAN13", "EAN8", "UPCA", "UPCE", "Code128", "Code39", "ITF", "QRCode", "DataMatrix"];

const ZXING_FORMAT_MAP: Record<string, BarcodeFormatName> = {
  EAN13: "ean_13",
  EAN8: "ean_8",
  UPCA: "upc_a",
  UPCE: "upc_e",
  Code128: "code_128",
  Code39: "code_39",
  ITF: "itf",
  QRCode: "qr_code",
  DataMatrix: "data_matrix"
};

function normalizeFormat(format?: string): BarcodeFormatName {
  if (!format) {
    return "unknown";
  }

  return ZXING_FORMAT_MAP[format] ?? "unknown";
}

export class ZXingFallbackEngine implements DetectionEngine {
  name = "fallback";
  private modulePromise: Promise<any> | null = null;
  private preparedPromise: Promise<void> | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  async detect(input: ImageBitmap | HTMLCanvasElement | ImageData): Promise<ScanResult[]> {
    if (!(input instanceof HTMLCanvasElement)) {
      return [];
    }

    const module = await this.loadModule();
    const variants = this.buildVariants(input);

    for (const variant of variants) {
      const imageData = toImageData(variant.canvas);
      if (!imageData) {
        continue;
      }

      const results = await module.readBarcodes(imageData, {
        formats: ZXING_FORMATS,
        maxNumberOfSymbols: 3,
        tryHarder: true,
        tryRotate: true
      });

      if (results.length > 0) {
        const timestamp = Date.now();
        return results
          .filter((result: any) => typeof result?.text === "string" && result.text.length > 0)
          .map((result: any) => ({
            rawValue: result.text,
            format: normalizeFormat(result.format),
            timestamp,
            source: "fallback" as const,
            confidence: variant.confidence
          }));
      }
    }

    return [];
  }

  private async loadModule(): Promise<any> {
    if (!this.modulePromise) {
      this.modulePromise = import("zxing-wasm/reader");
    }

    const module = await this.modulePromise;
    if (!this.preparedPromise) {
      this.preparedPromise = Promise.resolve(
        module.prepareZXingModule({
          overrides: {
            locateFile: (path: string, prefix: string) =>
              path.endsWith(".wasm") ? "/vendor/zxing_reader.wasm" : `${prefix}${path}`
          },
          fireImmediately: true
        })
      ).then(() => undefined);
    }

    await this.preparedPromise;
    return module;
  }

  private buildVariants(input: HTMLCanvasElement) {
    const enhanced = increaseContrast(input);

    return [
      { canvas: enhanced, confidence: 0.72 },
      { canvas: rotateCanvas(enhanced, 90), confidence: 0.68 },
      { canvas: rotateCanvas(enhanced, 180), confidence: 0.66 },
      { canvas: rotateCanvas(enhanced, 270), confidence: 0.68 }
    ];
  }
}
