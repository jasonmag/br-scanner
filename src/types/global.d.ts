import type { BarcodeFormatName } from "@/types/scanner";

declare global {
  interface DetectedBarcode {
    boundingBox?: DOMRectReadOnly;
    cornerPoints?: ReadonlyArray<{ x: number; y: number }>;
    format?: BarcodeFormatName | string;
    rawValue?: string;
  }

  interface BarcodeDetector {
    detect(
      source: ImageBitmapSource | OffscreenCanvas
    ): Promise<DetectedBarcode[]>;
  }

  interface BarcodeDetectorConstructor {
    new (options?: { formats?: string[] }): BarcodeDetector;
    getSupportedFormats?: () => Promise<string[]>;
  }

  var BarcodeDetector: BarcodeDetectorConstructor | undefined;

  interface MediaTrackCapabilities {
    zoom?: { min?: number; max?: number; step?: number } | number;
    torch?: boolean;
  }

  interface MediaTrackSettings {
    zoom?: number;
    torch?: boolean;
  }

  interface MediaTrackConstraintSet {
    torch?: boolean;
    zoom?: number;
  }
}

export {};
