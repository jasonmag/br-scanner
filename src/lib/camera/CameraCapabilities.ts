import type { TorchState, ZoomState } from "@/types/camera";

function readZoomRange(value: MediaTrackCapabilities["zoom"]) {
  if (!value || typeof value === "number") {
    return null;
  }

  return {
    min: value.min ?? 1,
    max: value.max ?? 1,
    step: value.step ?? 0.1
  };
}

export function toZoomState(
  capabilities: MediaTrackCapabilities | null,
  settings: MediaTrackSettings | null
): ZoomState {
  const zoomRange = readZoomRange(capabilities?.zoom);

  if (!zoomRange) {
    return {
      supported: false,
      min: 1,
      max: 1,
      step: 0.1,
      value: 1
    };
  }

  return {
    supported: true,
    min: zoomRange.min,
    max: zoomRange.max,
    step: zoomRange.step,
    value: typeof settings?.zoom === "number" ? settings.zoom : zoomRange.min
  };
}

export function toTorchState(
  capabilities: MediaTrackCapabilities | null,
  settings: MediaTrackSettings | null
): TorchState {
  return {
    supported: Boolean(capabilities?.torch),
    enabled: Boolean(settings?.torch)
  };
}
