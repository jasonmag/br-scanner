import type { ScanResult } from "@/types/scanner";

interface ScanResultCardProps {
  result: ScanResult | null;
}

export function ScanResultCard({ result }: ScanResultCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea)]">Last Result</p>
      {result ? (
        <div className="mt-3 space-y-1">
          <p className="text-2xl font-semibold">{result.rawValue}</p>
          <p className="text-sm text-[var(--muted)]">
            {result.format} via {result.source}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[var(--muted)]">No barcode detected yet.</p>
      )}
    </div>
  );
}
