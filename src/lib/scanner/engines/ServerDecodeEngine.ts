import type { DetectionEngine } from "@/lib/scanner/engines/DetectionEngine";
import type { BarcodeFormatName, ScanResult } from "@/types/scanner";

interface ServerDecodePayload {
  results?: Array<{
    value?: string;
    format?: string;
    confidence?: number;
  }>;
}

function normalizeFormat(format?: string): BarcodeFormatName {
  switch (format) {
    case "ean_13":
    case "ean_8":
    case "upc_a":
    case "upc_e":
    case "code_128":
    case "code_39":
    case "itf":
    case "qr_code":
    case "data_matrix":
      return format;
    default:
      return "unknown";
  }
}

export class ServerDecodeEngine implements DetectionEngine {
  name = "server";
  private lastAttemptAt = 0;
  private readonly minimumIntervalMs = 350;

  isAvailable(): boolean {
    return typeof window !== "undefined" && typeof fetch === "function";
  }

  async detect(input: ImageBitmap | HTMLCanvasElement | ImageData): Promise<ScanResult[]> {
    if (!(input instanceof HTMLCanvasElement)) {
      return [];
    }

    const now = Date.now();
    if (now - this.lastAttemptAt < this.minimumIntervalMs) {
      return [];
    }
    this.lastAttemptAt = now;

    const blob = await new Promise<Blob | null>((resolve) => input.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      return [];
    }

    const formData = new FormData();
    formData.set("image", blob, "scan.jpg");

    try {
      const response = await fetch("/api/decode", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as ServerDecodePayload;
      const timestamp = Date.now();
      return (payload.results ?? [])
        .filter((result) => typeof result.value === "string" && result.value.length > 0)
        .map((result) => ({
          rawValue: result.value ?? "",
          format: normalizeFormat(result.format),
          timestamp,
          source: "server" as const,
          confidence: result.confidence
        }));
    } catch {
      return [];
    }
  }
}
