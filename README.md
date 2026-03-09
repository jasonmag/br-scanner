# Barcode Scanner

Mobile-first barcode scanner web app for phone browsers. It opens the rear camera, scans continuously without a capture button, prefers the native `BarcodeDetector` API when present, and falls back to a deterministic canvas-based decode pipeline scaffold when native support is unavailable.

## Overview

- Next.js + TypeScript app-router application
- Camera manager isolated from UI code
- Continuous scan loop with duplicate suppression
- Zoom and torch capability detection
- Docker and Kamal deployment skeletons
- Health endpoint at `/api/health`

## Supported Browsers

Primary targets:

- Android Chrome
- Android Edge
- Samsung Internet
- iPhone Safari
- iPhone Chrome

The app feature-detects camera, native barcode detection, zoom, and torch support. Unsupported features degrade cleanly instead of breaking the page.

## Permissions

The scanner requires camera access and should be served over HTTPS in production. On mobile browsers, camera access may be blocked on insecure origins.

## Local Setup

1. Install dependencies with `npm install`
2. Copy `.env.example` values into your environment if needed
3. Run `npm run dev`
4. Open `http://localhost:3000/scanner`

## Commands

- `npm run dev` starts the development server
- `npm run build` builds the production app
- `npm run start` starts the production server
- `npm run typecheck` runs TypeScript without emitting files
- `npm run test` runs baseline unit tests

## Environment Variables

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_NAME=Barcode Scanner
NEXT_PUBLIC_ENABLE_AI_ASSIST=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

## Docker

Build and run with:

```bash
docker build -t br-scanner .
docker run --rm -p 3000:3000 --env-file .env.example br-scanner
```

The container exposes port `3000` and uses `/api/health` for health checks.

## Kamal Deployment

The deploy template lives at `config/deploy.yml`.

Before deploying:

1. Ensure Docker is installed on the target host referenced by your SSH config alias
2. Put `KAMAL_REGISTRY_USERNAME` and `KAMAL_REGISTRY_PASSWORD` in a local `.env`
4. Confirm DNS for `scanner.jasonmag.com` points at the server
5. Load `.env` into your shell
6. Run `kamal setup`
7. Run `kamal deploy`

This project is preconfigured for:

- image: `jasonmaglangit/br-scanner`
- host: `nexstar`
- public hostname: `scanner.jasonmag.com`

Example:

```bash
set -a
source .env
set +a
kamal setup
kamal deploy
```

## Privacy Notes

The scanner is intended to process frames locally in the browser. This project does not upload camera frames or store images by default.

## Known Limitations

- The fallback decoder uses `zxing-wasm` and serves its `.wasm` binary from the app itself, but real mobile-browser testing is still required for difficult angles, glare, and blur.
- The AI assist layer is intentionally optional and currently a non-blocking placeholder.
- Real mobile-browser testing is still required for zoom and torch behavior across devices.

## Future Improvements

- Add stronger perspective correction for steep barcode angles
- Add optional ONNX region proposal for difficult scans
- Expand integration and end-to-end test coverage
- Add stronger scan quality hints driven by live heuristics
