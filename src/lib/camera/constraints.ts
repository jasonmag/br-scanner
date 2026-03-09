export function buildPreferredVideoConstraints(deviceId?: string): MediaTrackConstraints {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    };
  }

  return {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };
}
