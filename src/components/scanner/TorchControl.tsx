import type { TorchState } from "@/types/camera";

interface TorchControlProps {
  torch: TorchState;
  onToggle: () => void;
}

export function TorchControl({ torch, onToggle }: TorchControlProps) {
  if (!torch.supported) {
    return null;
  }

  return (
    <button
      className="rounded-full border border-[var(--panel-border)] bg-white/70 px-4 py-3"
      onClick={onToggle}
      type="button"
    >
      {torch.enabled ? "Torch on" : "Torch off"}
    </button>
  );
}
