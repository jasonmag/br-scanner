export type BarcodeFormatName =
  | "ean_13"
  | "ean_8"
  | "upc_a"
  | "upc_e"
  | "code_128"
  | "code_39"
  | "itf"
  | "qr_code"
  | "data_matrix"
  | "unknown";

export type ScanEngineSource = "native" | "server" | "fallback" | "ai-assisted";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScanResult {
  rawValue: string;
  format: BarcodeFormatName;
  timestamp: number;
  source: ScanEngineSource;
  boundingBox?: BoundingBox;
  confidence?: number;
}

export interface ScannerErrorState {
  code:
    | "PERMISSION_DENIED"
    | "NO_CAMERA"
    | "UNSUPPORTED_BROWSER"
    | "CAMERA_START_FAILED"
    | "TRACK_CAPABILITIES_FAILED"
    | "ZOOM_UNSUPPORTED"
    | "SCAN_FAILED"
    | "AI_MODEL_LOAD_FAILED";
  message: string;
}

export interface ScannerConfig {
  stopOnSuccess: boolean;
  continuous: boolean;
  enableAiAssist: boolean;
  enableTorch: boolean;
  duplicateCooldownMs: number;
  scanRegionMode: "center-roi" | "full-frame" | "hybrid";
  targetScansPerSecond: number;
  preferNativeBarcodeDetector: boolean;
  debug: boolean;
}

export interface ScanState {
  isScanning: boolean;
  isPaused: boolean;
  mode: "single-scan" | "continuous" | "paused";
  statusMessage: string;
  activeEngine: ScanEngineSource | null;
  attemptsPerSecond: number;
  lastScanDurationMs: number | null;
}
