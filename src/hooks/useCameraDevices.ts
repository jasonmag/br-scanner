"use client";

import { useEffect, useState } from "react";
import type { CameraDeviceInfo } from "@/types/camera";

export function useCameraDevices() {
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadDevices = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return;
      }

      const nextDevices = await navigator.mediaDevices.enumerateDevices();
      if (!mounted) {
        return;
      }

      setDevices(
        nextDevices
          .filter((device) => device.kind === "videoinput")
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${index + 1}`
          }))
      );
    };

    void loadDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", loadDevices);

    return () => {
      mounted = false;
      navigator.mediaDevices?.removeEventListener?.("devicechange", loadDevices);
    };
  }, []);

  return devices;
}
