# AGENT.md

## Agent Name
Codex Build Agent - Mobile Browser Barcode Scanner

## Mission
Build a production-grade mobile browser barcode scanner that uses a phone camera through the browser, without any hardware barcode scanner device.

This project must:
- Work on mobile browsers using the device camera.
- Continuously scan barcodes without requiring a manual capture button.
- Support zoom in and zoom out when the camera/browser supports zoom.
- Scan the visible camera region efficiently.
- Support common barcode formats.
- Be designed with a reliable fallback architecture.
- Optionally use AI-assisted barcode-region detection to improve scanning under difficult conditions.
- Be containerized with Docker.
- Be deployable to a server using Kamal.
- Be maintainable, testable, and production-ready.

---

## 1. Product Vision
We are building a browser-based barcode scanner web app that can be opened on a mobile device and used as a live barcode reader.

The user experience should be:
1. User opens the scanner page.
2. Browser asks for camera permission.
3. Rear camera opens automatically.
4. Scanner starts scanning immediately.
5. User can zoom in/out if supported by device.
6. App detects barcode without pressing a scan button.
7. App returns the decoded value.
8. App can optionally continue scanning or stop after success.

The scanner should be usable in:
- Internal web apps.
- Warehouse-style workflows.
- Inventory systems.
- Supermarket receiving workflows.
- Delivery confirmation tools.
- Browser-based mobile business tools.
- PWA-style mobile web apps.

## 2. Technical Direction

### 2.1 Primary Stack
Use the following stack unless a blocking issue requires a documented exception:
- Next.js (latest stable)
- TypeScript
- React
- Tailwind CSS
- Docker
- Kamal
- Node.js current LTS

### 2.2 Barcode Scanning Strategy
Implement layered scanning support.

First-choice engine:
- Native browser `BarcodeDetector` API

Fallback engine:
- Browser camera frame extraction
- OpenCV.js preprocessing
- JS/WASM decoding path using a robust decoding library

Optional AI-assist layer:
- ONNX Runtime Web
- AI model used only to suggest likely barcode regions
- Final barcode decoding must still be done by deterministic barcode decoder logic

AI should improve reliability, not become a hard requirement.

## 3. Non-Negotiable Requirements
The system must:
- Use the mobile camera via browser.
- Not require any external scanner hardware.
- Scan automatically after camera permission is granted.
- Support rear-facing camera by default.
- Support zoom when available.
- Degrade cleanly when zoom is not available.
- Support real-time detection.
- Avoid duplicate repeated scans in rapid bursts.
- Handle camera stop/start lifecycle correctly.
- Work under HTTPS in production.
- Be deployable with Docker and Kamal.
- Keep the architecture modular and maintainable.

## 4. Supported Barcode Formats
Initial required support:
- EAN-13
- EAN-8
- UPC-A
- UPC-E
- Code 128
- Code 39
- ITF
- QR Code
- Data Matrix

Optional later:
- PDF417
- Codabar
- Aztec

## 5. Browser and Device Support Goals
Primary target devices:
- Android Chrome
- Android Edge
- Samsung Internet
- iPhone Safari
- iPhone Chrome

Support policy:
- Feature detect everything.
- Never assume `BarcodeDetector` exists.
- Never assume zoom exists.
- Never assume torch exists.
- Fall back gracefully.
- Provide friendly messages for unsupported features.

## 6. Deployment Goal
The application must be deployable to a Linux server using:
- Docker image build
- Kamal deployment
- Reverse proxy / HTTPS at server level
- Production environment variables
- Health checks
- Zero/minimal downtime deploy behavior

## 7. System Architecture

### 7.1 Core Layers

Layer A - UI Layer, responsible for:
- Camera preview rendering
- Scan overlay
- Zoom controls
- Torch toggle if supported
- Status display
- Detection result display
- Error state display

Layer B - Camera Control Layer, responsible for:
- Opening the camera
- Selecting the correct camera
- Reading capabilities
- Applying constraints like zoom
- Managing start/stop lifecycle
- Exposing current camera state

Layer C - Scan Orchestration Layer, responsible for:
- Continuous frame scanning loop
- Scan throttling
- Region-of-interest logic
- Deduplication
- Engine fallback ordering
- Reporting results to UI

Layer D - Detection Engines, responsible for:
- Barcode decoding
- Native engine implementation
- Fallback engine implementation
- Optional AI-assist region proposal

Layer E - Utilities, responsible for:
- Frame conversion
- ROI crop logic
- Image quality heuristics
- Duplicate suppression
- Performance metrics
- Debug helpers

## 8. Directory Structure
Use this exact or very similar structure:

```text
.
├─ AGENT.md
├─ README.md
├─ Dockerfile
├─ .dockerignore
├─ .env.example
├─ config/
│  └─ kamal/
│     └─ deploy.yml
├─ public/
│  ├─ models/
│  │  └─ barcode-region-detector.onnx
│  └─ icons/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ scanner/
│  │     └─ page.tsx
│  ├─ components/
│  │  ├─ scanner/
│  │  │  ├─ ScannerView.tsx
│  │  │  ├─ ScannerOverlay.tsx
│  │  │  ├─ ZoomControl.tsx
│  │  │  ├─ TorchControl.tsx
│  │  │  ├─ CameraStatus.tsx
│  │  │  └─ ScanResultCard.tsx
│  ├─ hooks/
│  │  ├─ useBarcodeScanner.ts
│  │  ├─ useCameraDevices.ts
│  │  └─ usePageVisibility.ts
│  ├─ lib/
│  │  ├─ camera/
│  │  │  ├─ CameraManager.ts
│  │  │  ├─ CameraCapabilities.ts
│  │  │  └─ constraints.ts
│  │  ├─ scanner/
│  │  │  ├─ ScanLoop.ts
│  │  │  ├─ ScanCoordinator.ts
│  │  │  ├─ ScanSession.ts
│  │  │  ├─ scanConfig.ts
│  │  │  ├─ engines/
│  │  │  │  ├─ NativeBarcodeDetectorEngine.ts
│  │  │  │  ├─ ZXingFallbackEngine.ts
│  │  │  │  ├─ OpenCvPreprocessor.ts
│  │  │  │  └─ AIAssistRegionEngine.ts
│  │  │  ├─ heuristics/
│  │  │  │  ├─ blur.ts
│  │  │  │  ├─ brightness.ts
│  │  │  │  ├─ contrast.ts
│  │  │  │  └─ roi.ts
│  │  │  └─ utils/
│  │  │     ├─ dedupe.ts
│  │  │     ├─ timing.ts
│  │  │     ├─ imageBitmap.ts
│  │  │     ├─ canvasPool.ts
│  │  │     └─ logger.ts
│  │  ├─ ai/
│  │  │  ├─ modelLoader.ts
│  │  │  └─ postprocess.ts
│  │  └─ browser/
│  │     ├─ featureDetection.ts
│  │     └─ permissions.ts
│  ├─ types/
│  │  ├─ scanner.ts
│  │  ├─ camera.ts
│  │  └─ ai.ts
│  └─ styles/
│     └─ globals.css
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
└─ scripts/
   ├─ verify-env.sh
   └─ healthcheck.sh
```

## 9. Core Functional Requirements

### 9.1 Camera Startup
The app must:
- Request camera access on user interaction if browser requires it.
- Prefer rear camera using `facingMode: { ideal: "environment" }`.
- Handle permission denied cleanly.
- Handle missing camera cleanly.
- Show loading state while camera initializes.
- Auto-start scanning once stream is active.

### 9.2 Zoom
The app must:
- Detect whether zoom is supported via `MediaStreamTrack.getCapabilities()`.
- Expose zoom UI only if supported.
- Allow zoom slider changes in real time.
- Persist chosen zoom value while camera session is active.
- Fail gracefully if `applyConstraints` fails.

### 9.3 Torch
If available, optionally support torch:
- Detect support via capabilities.
- Expose torch toggle.
- Do not break scanning on unsupported devices.

Torch is optional, but implement if practical.

### 9.4 Continuous Scanning
The scanner must:
- Continuously scan frames.
- Not require manual capture.
- Avoid overlapping detection calls.
- Use ROI-first scanning to reduce CPU.
- Periodically do full-frame scanning if ROI fails.
- Debounce duplicate barcode reads.

### 9.5 Result Handling
On successful decode, return:
- Raw value
- Format
- Engine source
- Timestamp
- Bounding box if available
- Optional confidence if engine provides something usable

### 9.6 Duplicate Suppression
If the same barcode is decoded repeatedly in a short window:
- Suppress duplicate events.
- Allow configurable cooldown.
- Default cooldown: `1200 ms`.

### 9.7 Session Modes
Support config modes:
- `single-scan`: stop after first valid barcode
- `continuous`: continue scanning after successful scan
- `paused`: keep camera open but stop detection loop

## 10. Detection Pipeline

### 10.1 Detection Order
Use this engine order:
1. Native `BarcodeDetector`
2. Preprocessed fallback decode
3. AI-assisted region proposal + deterministic decode

### 10.2 Native Detection
If `BarcodeDetector` is available:
- Instantiate detector with supported formats.
- Scan center ROI first.
- If no result, periodically scan full frame.
- If successful, emit result immediately.

### 10.3 Fallback Detection
If native detector is unavailable or returns poor results:
- Capture frame to canvas.
- Crop ROI.
- Preprocess image.
- Run barcode decode via fallback decoder.
- Retry with scaled ROI or full frame if needed.

### 10.4 AI-Assist
Use AI only if enabled.

AI engine should:
- Analyze a frame or scaled preview frame.
- Propose one or more barcode candidate boxes.
- Return those boxes to deterministic decoder.
- Never block core scanner if model load fails.

## 11. Image Processing Strategy
Preprocessing goals:
- Improve scan reliability in difficult conditions.
- Handle low contrast, blur, small barcode area, uneven lighting, and noisy backgrounds.

Possible pipeline steps:
- Grayscale conversion
- Resize
- Contrast normalization
- Sharpening
- Adaptive threshold
- Edge emphasis
- Candidate region extraction

Do not over-process every frame. Apply heavier processing only when:
- Native path fails
- Scan cadence allows it
- Device performance can handle it

## 12. AI Strategy

### 12.1 AI Role
AI is not the barcode decoder.
AI is only a barcode-region finder or ROI prioritizer.

### 12.2 AI Goals
AI may help when:
- Barcode is small
- Barcode is off-center
- Background is cluttered
- User is slightly far away
- Barcode is rotated or partially obstructed

### 12.3 AI Rules
- Lazy load model.
- Local inference only.
- No server-side image upload for detection.
- If AI fails, scanner must still work.
- Keep AI optional via feature flag.

### 12.4 Suggested Runtime and Model
- Runtime: ONNX Runtime Web
- Model: lightweight object detection model optimized for barcode-like rectangular high-frequency patterns
- Keep inference lightweight for mobile

## 13. UX Requirements
The scanner UI must include:
- Camera preview
- Centered scan guide overlay
- Visible scan line or frame guide
- Status text
- Result display
- Zoom slider when available
- Torch button when available
- Retry button for errors
- Clean mobile-first layout

UX state messages can include:
- Starting camera...
- Requesting permission...
- Camera ready
- Align barcode inside frame
- Move closer
- Hold steady
- More light needed
- Barcode detected
- Camera permission denied
- No camera found
- Scanner unavailable in this browser

## 14. Accessibility Requirements
The app should:
- Use readable labels.
- Provide textual status updates.
- Use sufficiently high contrast.
- Avoid relying only on color.
- Support keyboard interaction where relevant.
- Support reduced motion where possible.
- Expose proper button labels and ARIA attributes.

## 15. Security and Privacy
The scanner must:
- Process frames locally in the browser.
- Not upload camera frames by default.
- Not store images unless explicitly enabled.
- Use HTTPS in production.
- Stop stream when page/component is left.
- Avoid leaking raw camera data unnecessarily.

Add explicit privacy notes in `README.md`.

## 16. Performance Requirements
The scanner must be mindful of:
- Mobile CPU usage
- Battery consumption
- Camera thermals
- Re-render frequency
- Memory churn

Performance rules:
- Do not process every frame if not needed.
- Target scan cadence around `8-15` attempts/sec depending on device.
- Use ROI-first scanning.
- Reuse canvas buffers.
- Reuse image objects where possible.
- Pause scanning when page is hidden.
- Clean up all loops and media tracks on unmount.

## 17. Type Definitions
Use strong typing.

### 17.1 `src/types/scanner.ts`
```ts
export type BarcodeFormatName =
  | "ean_13"
  | "ean_8"
  | "upc_a"
  | "upc_e"
  | "code_128"
  | "code_39"
  | "itf"
  | "qr_code"
  | "data_matrix"
  | "unknown";

export type ScanEngineSource = "native" | "fallback" | "ai-assisted";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScanResult {
  rawValue: string;
  format: BarcodeFormatName;
  timestamp: number;
  source: ScanEngineSource;
  boundingBox?: BoundingBox;
  confidence?: number;
}

export interface ScannerErrorState {
  code:
    | "PERMISSION_DENIED"
    | "NO_CAMERA"
    | "UNSUPPORTED_BROWSER"
    | "CAMERA_START_FAILED"
    | "TRACK_CAPABILITIES_FAILED"
    | "ZOOM_UNSUPPORTED"
    | "SCAN_FAILED"
    | "AI_MODEL_LOAD_FAILED";
  message: string;
}

export interface ScannerConfig {
  stopOnSuccess: boolean;
  continuous: boolean;
  enableAiAssist: boolean;
  enableTorch: boolean;
  duplicateCooldownMs: number;
  scanRegionMode: "center-roi" | "full-frame" | "hybrid";
  targetScansPerSecond: number;
  preferNativeBarcodeDetector: boolean;
  debug: boolean;
}
```

### 17.2 `src/types/camera.ts`
```ts
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
```

## 18. Camera Manager Specification
File: `src/lib/camera/CameraManager.ts`

Responsibilities:
- Start stream
- Stop stream
- Restart stream
- Switch cameras
- Get active video track
- Read capabilities
- Read settings
- Apply zoom
- Apply torch
- Expose stream to UI

Methods:
- `start(preferredDeviceId?: string): Promise<MediaStream>`
- `stop(): void`
- `restart(): Promise<MediaStream>`
- `getVideoTrack(): MediaStreamTrack | null`
- `getCapabilities(): MediaTrackCapabilities | null`
- `getSettings(): MediaTrackSettings | null`
- `applyZoom(value: number): Promise<void>`
- `setTorch(enabled: boolean): Promise<void>`
- `listVideoDevices(): Promise<CameraDeviceInfo[]>`

Rules:
- Do not leak multiple active streams.
- Always stop old track before switching.
- Catch and normalize browser errors.

## 19. Scan Loop Specification
File: `src/lib/scanner/ScanLoop.ts`

Responsibilities:
- Maintain active scan cycle
- Prevent concurrent scans
- Call detection engines in order
- Apply throttling
- Emit results
- Handle pause/resume
- Respect page visibility

Rules:
- Scanning must not overlap.
- One frame should not trigger multiple active decode promises.
- Use timestamps to throttle attempts.
- Pause when app/page becomes hidden.

Suggested behavior:
- Quick lightweight attempts on ROI
- Less frequent full-frame fallback
- Adaptive scan interval based on previous failures or heavy CPU use

## 20. Detection Engine Contracts
Create a common interface:

```ts
export interface DetectionEngine {
  name: string;
  isAvailable(): Promise<boolean> | boolean;
  detect(input: ImageBitmap | HTMLCanvasElement | ImageData): Promise<ScanResult[]>;
}
```

### 20.1 Native Engine
File: `src/lib/scanner/engines/NativeBarcodeDetectorEngine.ts`

Responsibilities:
- Detect native API availability
- Create detector with supported formats
- Scan ROI or full-frame input
- Map native output into unified `ScanResult`

### 20.2 Fallback Engine
File: `src/lib/scanner/engines/ZXingFallbackEngine.ts`

Responsibilities:
- Receive preprocessed image/canvas
- Attempt deterministic decode
- Support selected barcode formats
- Return unified `ScanResult`

### 20.3 OpenCV Preprocessor
File: `src/lib/scanner/engines/OpenCvPreprocessor.ts`

Responsibilities:
- Grayscale conversion
- Sharpening
- Thresholding
- Crop scaling
- Optional edge emphasis

### 20.4 AI Assist Region Engine
File: `src/lib/scanner/engines/AIAssistRegionEngine.ts`

Responsibilities:
- Load ONNX model lazily
- Run region proposal
- Return candidate barcode boxes
- Never become a required dependency for baseline scanning

## 21. Scan Region Strategy
Use hybrid mode by default.

Center ROI (primary fast path):
- Scan center guide area first
- Improves speed
- Aligns with user expectation

Full Frame (fallback path):
- Run every N failed ROI attempts
- Useful when barcode is outside center

AI ROI (when enabled):
- Run periodically, not every frame
- Propose candidate areas
- Send those candidate areas to deterministic decoder

## 22. Quality Heuristics
Implement lightweight heuristics:
- Blur estimate
- Brightness estimate
- Contrast estimate
- ROI occupancy estimate

Use heuristics to:
- Show user hints
- Decide whether to skip expensive decode
- Determine whether to increase preprocessing effort

Example messages:
- Low brightness -> "Increase lighting"
- High blur -> "Hold steady"
- Tiny candidate -> "Move closer"

## 23. State Management Rules
Use local React state and hooks unless complexity clearly requires more.

Recommended hook: `useBarcodeScanner`

The hook should expose:
- `start`
- `stop`
- `pause`
- `resume`
- `setZoom`
- `toggleTorch`
- `switchCamera`
- `devices`
- `cameraState`
- `scanState`
- `lastResult`
- `error`

Do not overcomplicate with external state libraries unless needed.

## 24. Testing Requirements
Unit tests should cover:
- Dedupe logic
- ROI calculations
- Scan throttling rules
- Feature detection helpers
- Error normalization
- Camera capability mapping

Integration tests should cover:
- Scanner start/stop lifecycle
- Engine selection order
- Fallback behavior
- Duplicate suppression behavior

E2E tests (where feasible) should cover:
- Basic scanner page load
- Permissions handling UI path
- Mock engine successful scan
- Unsupported feature UI path

Use mocks for browser camera APIs where real camera access is not possible.

## 25. Observability and Debugging
Implement a debug mode.

Debug mode may show:
- Active engine
- Scan FPS / attempts per second
- Last scan duration
- Current ROI mode
- Zoom capability
- Torch capability
- Current camera device label
- Recent error log

Do not expose debug UI in production by default.

## 26. README Requirements
The project `README.md` must include:
- Project overview
- Supported browsers
- Required permissions
- Local setup
- Dev commands
- Docker usage
- Kamal deployment steps
- Environment variables
- Privacy notes
- Known limitations
- Future improvements

## 27. Docker Requirements
The app must include a production-ready `Dockerfile`.

Docker goals:
- Small production image
- Deterministic install
- Build Next.js app
- Serve app in production mode
- Use standard Node production container approach
- Expose correct port
- Support healthcheck

Example expectations:
- Multi-stage build
- Dependency install stage
- Build stage
- Runtime stage

## 28. Kamal Deployment Requirements
We will deploy with Kamal.

Kamal goals:
- Deploy containerized web app to Linux server
- Support environment variables
- Use registry-based deployment
- Support rolling deploys
- Expose app via proper host
- Prepare for HTTPS/reverse proxy in production

Deliverables needed:
- `config/kamal/deploy.yml`
- `.env.example`
- Deployment notes in `README.md`

Kamal requirements:
- Define service name
- Define image name
- Define server host(s)
- Define registry auth placeholders
- Define env/secret placeholders
- Define accessory only if needed
- Include healthcheck path

## 29. Environment Variables
Document and support variables like:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_NAME=Barcode Scanner
NEXT_PUBLIC_ENABLE_AI_ASSIST=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

If more variables are added, document all of them.

## 29.1 External API Documentation
If the project exposes an API for use by other applications, it must:

- Provide a clear documentation link in `README.md`
- Include request and response examples
- Include integration examples for external applications
- Document security expectations for API consumers

## 29.2 API Consumer Registration
If the project exposes an API for external consumers, it must be designed with API user registration in mind.

Minimum requirements:

- Document how an API consumer is registered
- Define how credentials are issued to the consumer
- Do not rely on CORS as the only protection mechanism
- Document whether unauthenticated free access exists and what rate limit applies to it
- Prefer API key or token-based access for non-public usage
- Confirm authenticated API credentials with the authentication/access service instead of a local static key list
- Treat authenticated requests as unlimited by default unless an explicit policy says otherwise
- Document how consumers are identified, activated, deactivated, and rotated
- Keep barcode decoding separate from API user/account management concerns where practical

## 30. Acceptance Criteria
The build is acceptable only if all are true:
- Mobile browser opens rear camera successfully.
- Scanner starts without needing a capture button.
- Zoom works on supported devices.
- Lack of zoom support does not break the scanner.
- Native barcode scanning is used when available.
- Fallback scanning exists and is functional.
- Duplicate repeated scans are suppressed.
- Scanner can continue or stop on success depending on config.
- Camera stops cleanly when page is left.
- Docker build succeeds.
- Kamal config is present and usable.
- README explains setup and deployment.
- README links to external API usage documentation when external integration is supported.
- Free unauthenticated API access, if offered, is rate-limited and documented.
- Authenticated API access, if offered, documents that default policy is unlimited unless otherwise configured.
- Authenticated API access, if offered, is confirmed against the authentication/access service before barcode decoding proceeds.
- Architecture is modular and maintainable.
- AI assist is optional and non-blocking.

## 31. Build Phases for Codex
Codex must follow these phases in order.

Phase 1 - Project Scaffold:
- Next.js TypeScript app
- Tailwind setup
- Base route and scanner page
- Folder structure
- README skeleton

Phase 2 - Camera Foundation:
- Camera permission flow
- Rear camera startup
- Video preview
- Device list
- Camera switching
- Camera lifecycle cleanup

Phase 3 - Zoom and Torch:
- Capability detection
- Zoom slider
- `applyConstraints` zoom updates
- Optional torch toggle

Phase 4 - Native Barcode Detection:
- Native detector wrapper
- Scan loop
- ROI scan
- Result emission
- Duplicate suppression

Phase 5 - Fallback Detection:
- Frame extraction
- Preprocessing utilities
- Fallback decoder
- Engine selection coordination

Phase 6 - AI Assist:
- Feature flag
- Lazy model loading
- ROI proposal
- AI-assisted decode path

Phase 7 - UX Hardening:
- Statuses
- Overlays
- Result cards
- Errors
- Retry behavior
- Mobile-first polish

Phase 8 - Testing:
- Unit tests
- Integration tests
- Mocked browser API tests

Phase 9 - Dockerization:
- Dockerfile
- `.dockerignore`
- Healthcheck
- Production start flow

Phase 10 - Kamal Deployment:
- Kamal config
- Env variable docs
- Deploy notes
- Health endpoint

## 32. Coding Standards
Codex must follow these rules:
- TypeScript strict mode
- No `any` unless justified and documented
- Small focused modules
- Clear naming
- No giant monolithic components
- Robust cleanup for async/browser resources
- Normalize errors into app-specific error objects
- Do not bury browser API calls deep in UI components
- Keep UI and engine logic separated

## 33. Constraints and Guardrails
Do not:
- Require hardware barcode scanners
- Require native app installation
- Upload camera frames to a server by default
- Block the whole scanner on AI model loading
- Assume all browsers support all features
- Make the scanner depend entirely on one experimental API
- Hardcode secrets
- Tightly couple UI to engine internals

Do:
- Feature detect
- Degrade gracefully
- Keep scanner functional even without AI
- Prioritize user-visible reliability
- Prefer maintainable code over clever code

## 34. Suggested Initial Dependencies
Codex may use suitable stable libraries where appropriate.

Likely categories:
- Next.js / React / TypeScript
- Tailwind CSS
- Barcode decoding fallback library
- OpenCV.js integration
- ONNX Runtime Web
- Testing libraries
- Optional class utilities

Only add dependencies that have a clear purpose.

## 35. Deliverables
Codex must produce:
- Full application scaffold
- Scanner page
- Camera manager
- Scan loop
- Native barcode engine
- Fallback engine
- Optional AI assist engine
- Reusable scanner hook
- Responsive UI components
- Tests
- Dockerfile
- Kamal deploy config
- README
- `.env.example`

## 36. Example User Flow Definition
Happy path:
1. User opens `/scanner`.
2. Page explains camera usage.
3. User taps start scanner.
4. Camera permission granted.
5. Rear camera opens.
6. Scan overlay is shown.
7. User points at barcode.
8. Barcode is detected automatically.
9. Result is displayed.
10. App vibrates or highlights success if supported.

Recovery path:
1. Permission denied.
2. App shows friendly instructions.
3. User retries.
4. Scanner starts correctly.

Fallback path:
1. Native detector unavailable.
2. App silently uses fallback engine.
3. Scan still works.

## 37. Example Scanner Config Defaults
Use sensible defaults like:

```ts
export const defaultScannerConfig = {
  stopOnSuccess: false,
  continuous: true,
  enableAiAssist: false,
  enableTorch: true,
  duplicateCooldownMs: 1200,
  scanRegionMode: "hybrid",
  targetScansPerSecond: 10,
  preferNativeBarcodeDetector: true,
  debug: false,
} as const;
```

## 38. Definition of Done
The project is done when:
- The codebase builds successfully.
- The scanner runs locally.
- The scanner works on mobile browser camera.
- Zoom works where supported.
- Fallback detection exists.
- Duplicate suppression works.
- Docker image builds successfully.
- Kamal deployment config is ready.
- README is complete.
- Code is modular and maintainable.

## 39. Final Instruction to Codex
Build this as a production-grade, mobile-first, browser-based barcode scanner with clean architecture and reliable fallbacks.

Prioritize:
- Scanning reliability
- Camera lifecycle correctness
- Graceful browser compatibility handling
- Maintainable TypeScript architecture
- Deployment readiness with Docker and Kamal

Do not optimize only for demos.
Build it as something that can realistically be used in a business web application.

---

Here is also a matching Codex prompt you can paste when you want Codex to start building from this file:

```text
Read and follow AGENT.md in the project root.

Build the full application in phases exactly as described. Start with project scaffold, then camera foundation, zoom support, native barcode scanning, fallback scanning, optional AI assist, tests, Dockerfile, and Kamal deployment config.

Use Next.js + TypeScript + Tailwind. Keep the architecture modular. Do not skip fallback support. Do not make AI mandatory. Ensure the app is production-ready and mobile-first.

After implementation, provide:
1. Summary of what was built
2. Files created/updated
3. Commands to run locally
4. Docker build/run commands
5. Kamal deploy notes
6. Known limitations
```
