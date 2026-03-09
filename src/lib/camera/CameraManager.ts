import { buildPreferredVideoConstraints } from "@/lib/camera/constraints";
import { toTorchState, toZoomState } from "@/lib/camera/CameraCapabilities";
import type { CameraDeviceInfo, CameraState } from "@/types/camera";
import type { ScannerErrorState } from "@/types/scanner";

const DEFAULT_CAMERA_STATE: CameraState = {
  isStarting: false,
  isActive: false,
  zoom: {
    supported: false,
    min: 1,
    max: 1,
    step: 0.1,
    value: 1
  },
  torch: {
    supported: false,
    enabled: false
  }
};

export class CameraManager {
  private stream: MediaStream | null = null;
  private currentDeviceId?: string;
  private state: CameraState = DEFAULT_CAMERA_STATE;

  getState(): CameraState {
    return this.state;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  async start(preferredDeviceId?: string): Promise<MediaStream> {
    this.state = { ...this.state, isStarting: true };
    this.stop();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildPreferredVideoConstraints(preferredDeviceId)
      });

      this.stream = stream;
      this.currentDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
      this.refreshState();
      this.state = {
        ...this.state,
        isStarting: false,
        isActive: true
      };
      return stream;
    } catch (error) {
      this.state = { ...DEFAULT_CAMERA_STATE };
      throw this.normalizeError(error);
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.state = { ...DEFAULT_CAMERA_STATE };
  }

  async restart(): Promise<MediaStream> {
    return this.start(this.currentDeviceId);
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] ?? null;
  }

  getCapabilities(): MediaTrackCapabilities | null {
    const track = this.getVideoTrack();

    if (!track || typeof track.getCapabilities !== "function") {
      return null;
    }

    return track.getCapabilities();
  }

  getSettings(): MediaTrackSettings | null {
    return this.getVideoTrack()?.getSettings() ?? null;
  }

  async applyZoom(value: number): Promise<void> {
    const track = this.getVideoTrack();
    const capabilities = this.getCapabilities();

    if (!track || !capabilities?.zoom) {
      throw {
        code: "ZOOM_UNSUPPORTED",
        message: "Zoom is not supported on this device."
      } satisfies ScannerErrorState;
    }

    await track.applyConstraints({
      advanced: [{ zoom: value }]
    });

    this.refreshState();
  }

  async setTorch(enabled: boolean): Promise<void> {
    const track = this.getVideoTrack();
    const capabilities = this.getCapabilities();

    if (!track || !capabilities?.torch) {
      return;
    }

    await track.applyConstraints({
      advanced: [{ torch: enabled }]
    });

    this.refreshState();
  }

  async listVideoDevices(): Promise<CameraDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`
      }));
  }

  private refreshState() {
    const capabilities = this.getCapabilities();
    const settings = this.getSettings();

    this.state = {
      isStarting: false,
      isActive: !!this.stream,
      deviceId: settings?.deviceId,
      zoom: toZoomState(capabilities, settings),
      torch: toTorchState(capabilities, settings)
    };
  }

  private normalizeError(error: unknown): ScannerErrorState {
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        return {
          code: "PERMISSION_DENIED",
          message: "Camera permission denied."
        };
      }

      if (error.name === "NotFoundError") {
        return {
          code: "NO_CAMERA",
          message: "No camera was found on this device."
        };
      }
    }

    return {
      code: "CAMERA_START_FAILED",
      message: "Camera start failed."
    };
  }
}
