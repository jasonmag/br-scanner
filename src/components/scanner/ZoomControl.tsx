import type { ZoomState } from "@/types/camera";

interface ZoomControlProps {
  zoom: ZoomState;
  onChange: (value: number) => void;
}

export function ZoomControl({ zoom, onChange }: ZoomControlProps) {
  if (!zoom.supported) {
    return null;
  }

  return (
    <label className="block rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea)]">Zoom</span>
      <input
        className="mt-3 w-full"
        type="range"
        min={zoom.min}
        max={zoom.max}
        step={zoom.step}
        value={zoom.value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
