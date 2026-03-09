import type { ScannerErrorState } from "@/types/scanner";

interface CameraStatusProps {
  message: string;
  error: ScannerErrorState | null;
}

export function CameraStatus({ message, error }: CameraStatusProps) {
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea)]">Status</p>
      <p className="mt-2 text-lg">{error?.message ?? message}</p>
    </div>
  );
}
