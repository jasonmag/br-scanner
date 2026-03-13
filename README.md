# Barcode Scanner

Mobile-first barcode scanner web app for phone browsers. It opens the rear camera, scans continuously without a capture button, prefers the native `BarcodeDetector` API when present, and falls back to a private Python decoder service running inside the same deployed container when local detection misses.

## Overview

- Next.js + TypeScript app-router application
- FastAPI barcode decoder for server-side fallback
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
BARCODE_DECODER_URL=http://127.0.0.1:8000
BARCODE_API_ALLOWED_ORIGINS=*
BARCODE_AUTH_SERVICE_URL=http://127.0.0.1:4000
BARCODE_AUTH_SERVICE_VALIDATE_PATH=/api/keys/validate
BARCODE_AUTH_SERVICE_SHARED_SECRET=
FREE_TIER_REQUESTS_PER_MINUTE=10
NEXT_PUBLIC_APP_NAME=Barcode Scanner
NEXT_PUBLIC_ENABLE_AI_ASSIST=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

`BARCODE_API_ALLOWED_ORIGINS` accepts `*` or a comma-separated list of allowed browser origins for cross-project requests.
`BARCODE_AUTH_SERVICE_URL` points to the authentication/access app that confirms registered API keys.
`BARCODE_AUTH_SERVICE_VALIDATE_PATH` is the auth-app endpoint used by this scanner to validate API keys.
`BARCODE_AUTH_SERVICE_SHARED_SECRET` is an optional service-to-service shared secret sent to the auth app.
`FREE_TIER_REQUESTS_PER_MINUTE` controls the anonymous request cap for callers without an API key.

## External API

Other projects can submit an image to the scanner service and receive the decoded barcode value back.

- `POST /api/identify`
- Content type: `multipart/form-data`
- Field name: `image`
- Free access: no credentials, rate-limited
- Registered access: `Authorization: Bearer <api_key>` or `X-API-Key: <api_key>`, confirmed by the auth app

Free-tier example:

```bash
curl -X POST http://localhost:3000/api/identify \
  -F "image=@./barcode.jpg"
```

Registered example:

```bash
curl -X POST http://localhost:3000/api/identify \
  -H "Authorization: Bearer your-issued-api-key" \
  -F "image=@./barcode.jpg"
```

For registered requests, the scanner first calls the auth service at `BARCODE_AUTH_SERVICE_URL + BARCODE_AUTH_SERVICE_VALIDATE_PATH`. The expected auth-service contract is:

```json
{
  "valid": true,
  "consumerId": "scanner-client-001",
  "status": "active"
}
```

Response:

```json
{
  "found": true,
  "value": "9556091140128",
  "format": "ean_13",
  "confidence": 0.88,
  "results": [
    {
      "value": "9556091140128",
      "format": "ean_13",
      "confidence": 0.88
    }
  ]
}
```

The existing `POST /api/decode` route still works and now returns the same response shape, so current scanner behavior remains compatible while external clients get a simpler top-level `value`.

Documentation:

- Client app setup guide: [docs/api-integration-guide.md](docs/api-integration-guide.md)
- API user registration guide: [docs/api-user-registration.md](docs/api-user-registration.md)
- Split-service architecture: [docs/api-access-architecture.md](docs/api-access-architecture.md)
- Separate access-service agent: [API_ACCESS_AGENT.md](API_ACCESS_AGENT.md)

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

The app can send scan frames to the private in-container Python decoder when browser-side detection fails. The decoder processes each upload entirely in memory, returns decoded barcode content, and does not persist images or write scan files to disk.

## Known Limitations

- The server-side fallback improves difficult scans, but real mobile-browser testing is still required for glare, blur, and steep perspective distortion.
- The AI assist layer is intentionally optional and currently a non-blocking placeholder.
- Real mobile-browser testing is still required for zoom and torch behavior across devices.

## Future Improvements

- Add stronger perspective correction for steep barcode angles
- Add optional ONNX region proposal for difficult scans
- Expand integration and end-to-end test coverage
- Add stronger scan quality hints driven by live heuristics
