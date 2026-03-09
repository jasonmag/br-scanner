export function hasMediaDevices(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export function hasBarcodeDetector(): boolean {
  return typeof window !== "undefined" && typeof window.BarcodeDetector !== "undefined";
}

export function isSecureContextAvailable(): boolean {
  return typeof window === "undefined" ? true : window.isSecureContext;
}

export function supportsImageCapture(): boolean {
  return typeof window !== "undefined" && "ImageCapture" in window;
}
