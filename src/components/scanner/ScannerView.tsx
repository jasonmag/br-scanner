"use client";

import { useEffect } from "react";
import { CameraStatus } from "@/components/scanner/CameraStatus";
import { ScanResultCard } from "@/components/scanner/ScanResultCard";
import { ScannerOverlay } from "@/components/scanner/ScannerOverlay";
import { TorchControl } from "@/components/scanner/TorchControl";
import { ZoomControl } from "@/components/scanner/ZoomControl";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

export function ScannerView() {
  const {
    videoRef,
    start,
    stop,
    pause,
    resume,
    setZoom,
    toggleTorch,
    switchCamera,
    devices,
    cameraState,
    scanState,
    lastResult,
    error
  } = useBarcodeScanner({
    enableAiAssist: process.env.NEXT_PUBLIC_ENABLE_AI_ASSIST === "true",
    debug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true"
  });

  useEffect(() => {
    void start();
    return () => stop();
  }, []);

  return (
    <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--sea)]">Scanner</p>
          <h1 className="mt-2 text-3xl font-semibold">Live mobile barcode capture</h1>
        </div>
        <div className="flex gap-3">
          <button
            className="rounded-full border border-[var(--panel-border)] bg-white/70 px-4 py-3"
            type="button"
            onClick={scanState.isPaused ? resume : pause}
          >
            {scanState.isPaused ? "Resume" : "Pause"}
          </button>
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-3 text-white"
            type="button"
            onClick={() => void start(cameraState.deviceId)}
          >
            Retry
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink shadow-scanner">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-[3/4] w-full object-cover"
          />
          <ScannerOverlay />
        </div>

        <div className="flex flex-col gap-4">
          <CameraStatus message={scanState.statusMessage} error={error} />
          <ScanResultCard result={lastResult} />
          <ZoomControl zoom={cameraState.zoom} onChange={(value) => void setZoom(value)} />
          <TorchControl torch={cameraState.torch} onToggle={() => void toggleTorch()} />

          <label className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea)]">
              Camera
            </span>
            <select
              className="mt-3 w-full rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2"
              value={cameraState.deviceId ?? ""}
              onChange={(event) => void switchCamera(event.target.value)}
            >
              <option value="">Auto select rear camera</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-[var(--muted)]">
            <p>Attempts/sec: {scanState.attemptsPerSecond}</p>
            <p>Last scan duration: {scanState.lastScanDurationMs?.toFixed(1) ?? "n/a"} ms</p>
            <p>Active engine: {scanState.activeEngine ?? "pending"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
