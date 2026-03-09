import type { ScannerConfig } from "@/types/scanner";

export const defaultScannerConfig: ScannerConfig = {
  stopOnSuccess: false,
  continuous: true,
  enableAiAssist: false,
  enableTorch: true,
  duplicateCooldownMs: 1200,
  scanRegionMode: "hybrid",
  targetScansPerSecond: 10,
  preferNativeBarcodeDetector: true,
  debug: false
};
