export interface ZoomState {
  supported: boolean;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface TorchState {
  supported: boolean;
  enabled: boolean;
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface CameraState {
  isStarting: boolean;
  isActive: boolean;
  deviceId?: string;
  zoom: ZoomState;
  torch: TorchState;
}
