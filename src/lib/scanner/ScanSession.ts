import type { DedupeEntry } from "@/lib/scanner/utils/dedupe";

export interface ScanSession {
  lastAcceptedResult: DedupeEntry | null;
  failedRoiAttempts: number;
}

export function createScanSession(): ScanSession {
  return {
    lastAcceptedResult: null,
    failedRoiAttempts: 0
  };
}
