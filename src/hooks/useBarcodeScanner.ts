"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CameraManager } from "@/lib/camera/CameraManager";
import { hasMediaDevices, isSecureContextAvailable } from "@/lib/browser/featureDetection";
import { queryCameraPermission } from "@/lib/browser/permissions";
import { ScanLoop } from "@/lib/scanner/ScanLoop";
import { defaultScannerConfig } from "@/lib/scanner/scanConfig";
import type { CameraDeviceInfo, CameraState } from "@/types/camera";
import type { ScanResult, ScanState, ScannerConfig, ScannerErrorState } from "@/types/scanner";
import { useCameraDevices } from "@/hooks/useCameraDevices";
import { usePageVisibility } from "@/hooks/usePageVisibility";

const DEFAULT_CAMERA_STATE: CameraState = {
  isStarting: false,
  isActive: false,
  zoom: { supported: false, min: 1, max: 1, step: 0.1, value: 1 },
  torch: { supported: false, enabled: false }
};

const DEFAULT_SCAN_STATE: ScanState = {
  isScanning: false,
  isPaused: false,
  mode: "single-scan",
  statusMessage: "Starting camera...",
  activeEngine: null,
  attemptsPerSecond: 0,
  lastScanDurationMs: null
};

export function useBarcodeScanner(configOverrides?: Partial<ScannerConfig>) {
  const config = useMemo(
    () => ({
      ...defaultScannerConfig,
      ...configOverrides
    }),
    [configOverrides]
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const managerRef = useRef<CameraManager | null>(null);
  const loopRef = useRef<ScanLoop | null>(null);
  const pageVisible = usePageVisibility();
  const devices = useCameraDevices();

  const [cameraState, setCameraState] = useState<CameraState>(DEFAULT_CAMERA_STATE);
  const [scanState, setScanState] = useState<ScanState>(DEFAULT_SCAN_STATE);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<ScannerErrorState | null>(null);

  if (!managerRef.current && typeof window !== "undefined") {
    managerRef.current = new CameraManager();
  }

  if (!loopRef.current && typeof window !== "undefined") {
    loopRef.current = new ScanLoop({
      config,
      onResult: (result, stats) => {
        setLastResult(result);
        setScanState((current) => ({
          ...current,
          isScanning: true,
          isPaused: false,
          lastScanDurationMs: stats.durationMs,
          activeEngine: result.source,
          statusMessage: "Barcode detected"
        }));
      },
      onState: ({ statusMessage, activeEngine, attemptsPerSecond, lastScanDurationMs }) => {
        setScanState((current) => ({
          ...current,
          statusMessage,
          activeEngine,
          attemptsPerSecond,
          lastScanDurationMs
        }));
      }
    });
  }

  useEffect(() => {
    if (!pageVisible) {
      loopRef.current?.pause();
      setScanState((current) => ({ ...current, isPaused: true, statusMessage: "Scanner paused" }));
      return;
    }

    if (cameraState.isActive) {
        setScanState((current) => ({
          ...current,
          isPaused: false,
          statusMessage: "Center the barcode in the frame, then tap Scan."
        }));
    }
  }, [cameraState.isActive, pageVisible]);

  useEffect(() => {
    return () => {
      loopRef.current?.stop();
      managerRef.current?.stop();
    };
  }, []);

  const start = async (preferredDeviceId?: string) => {
    if (!hasMediaDevices() || !isSecureContextAvailable() || !managerRef.current || !videoRef.current) {
      setError({
        code: "UNSUPPORTED_BROWSER",
        message: "This browser does not support required camera APIs."
      });
      return;
    }

    try {
      setError(null);
      setCameraState((current) => ({ ...current, isStarting: true }));
      setScanState((current) => ({ ...current, statusMessage: "Requesting permission..." }));

      await queryCameraPermission();
      const stream = await managerRef.current.start(preferredDeviceId);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraState(managerRef.current.getState());
      setScanState((current) => ({
        ...current,
        isScanning: false,
        isPaused: false,
        mode: "single-scan",
        statusMessage: "Center the barcode in the frame, then tap Scan."
      }));
      loopRef.current?.stop();
      loopRef.current?.start(videoRef.current);
      loopRef.current?.pause();
    } catch (nextError) {
      const normalizedError = nextError as ScannerErrorState;
      setError(normalizedError);
      setCameraState(DEFAULT_CAMERA_STATE);
      setScanState((current) => ({
        ...current,
        isScanning: false,
        isPaused: false,
        statusMessage: normalizedError.message
      }));
    }
  };

  const stop = () => {
    loopRef.current?.stop();
    managerRef.current?.stop();
    setCameraState(DEFAULT_CAMERA_STATE);
    setScanState((current) => ({
      ...current,
      isScanning: false,
      isPaused: false,
      statusMessage: "Camera stopped"
    }));
  };

  const pause = () => {
    loopRef.current?.pause();
    setScanState((current) => ({ ...current, isPaused: true, statusMessage: "Scanner paused" }));
  };

  const resume = () => {
    setScanState((current) => ({
      ...current,
      isPaused: false,
      statusMessage: "Center the barcode in the frame, then tap Scan."
    }));
  };

  const scanNow = async () => {
    if (!cameraState.isActive) {
      return;
    }

    setScanState((current) => ({
      ...current,
      isScanning: true,
      isPaused: false,
      statusMessage: "Scanning barcode...",
      activeEngine: null
    }));

    await loopRef.current?.scanOnce();

    setScanState((current) => ({
      ...current,
      isScanning: false
    }));
  };

  const setZoom = async (value: number) => {
    if (!managerRef.current) {
      return;
    }

    try {
      await managerRef.current.applyZoom(value);
      setCameraState(managerRef.current.getState());
    } catch (nextError) {
      setError(nextError as ScannerErrorState);
    }
  };

  const toggleTorch = async () => {
    if (!managerRef.current) {
      return;
    }

    try {
      await managerRef.current.setTorch(!cameraState.torch.enabled);
      setCameraState(managerRef.current.getState());
    } catch {
      setError({
        code: "TRACK_CAPABILITIES_FAILED",
        message: "Unable to update torch state."
      });
    }
  };

  const switchCamera = async (deviceId: string) => {
    await start(deviceId || undefined);
  };

  return {
    videoRef,
    start,
    stop,
    pause,
    resume,
    scanNow,
    setZoom,
    toggleTorch,
    switchCamera,
    devices: devices as CameraDeviceInfo[],
    cameraState,
    scanState,
    lastResult,
    error
  };
}
