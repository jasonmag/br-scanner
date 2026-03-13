# Barcode API Integration Guide

## Purpose

This project can act as a barcode-reading service for other applications.

Another app sends an image that contains a barcode to this service, and this service returns the decoded barcode value.

## Endpoint

- `POST /api/identify`
- Content type: `multipart/form-data`
- Form field: `image`

Base URL examples:

- Local: `http://localhost:3000`
- Current: `http://localhost:3000`

Full URL example:

```text
http://localhost:3000/api/identify
```

## Request Contract

Send one image file in a multipart form request.

Example `curl` request:

```bash
curl -X POST http://localhost:3000/api/identify \
  -F "image=@./barcode.jpg"
```

Registered request example:

```bash
curl -X POST http://localhost:3000/api/identify \
  -H "Authorization: Bearer <api_key>" \
  -F "image=@./barcode.jpg"
```

For registered access, this scanner confirms the key with the external authentication app before it sends the image to the decoder.

## Response Contract

Successful responses return HTTP `200` even when no barcode is found.

Example when a barcode is found:

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

Example when no barcode is found:

```json
{
  "found": false,
  "value": null,
  "format": null,
  "confidence": null,
  "results": []
}
```

## Error Responses

Possible error cases:

- `400` if the `image` field is missing
- `413` if the uploaded image is larger than `2 MB`
- `401` if an API key is provided but invalid
- `503` if an API key is provided but the authentication service cannot be reached
- `429` if the free unauthenticated tier exceeds its rate limit

Example `400` response:

```json
{
  "error": "Missing image upload."
}
```

## CORS Configuration

If another browser-based app will call this API directly, configure:

```env
BARCODE_API_ALLOWED_ORIGINS=*
```

For stricter access, set specific origins:

```env
BARCODE_API_ALLOWED_ORIGINS=https://app1.example.com,https://app2.example.com
```

Use `*` only when open cross-origin access is acceptable.

## Integration Patterns

### 1. Server-to-server integration

Best for:

- Laravel apps
- Rails apps
- Node backends
- Internal business systems

Flow:

1. User uploads or captures an image in the main app.
2. The main app sends that image to `/api/identify`.
3. The main app reads `value` from the response.
4. The main app uses that value in its own product lookup, inventory flow, or receiving workflow.

Advantages:

- No browser CORS issues
- API key or internal auth can be added later at the main app layer
- Keeps scanner service private if needed

### 2. Browser-to-API integration

Best for:

- React apps
- Next.js apps
- Vue apps
- Internal web tools

Flow:

1. Browser captures or selects an image.
2. Frontend sends `FormData` directly to `/api/identify`.
3. Frontend reads the returned `value`.
4. Frontend updates the UI or sends the barcode to its own backend.

Requirement:

- `BARCODE_API_ALLOWED_ORIGINS` must allow the calling app's origin.

## Example Integrations

### JavaScript / TypeScript frontend

```ts
async function identifyBarcode(file: File) {
  const formData = new FormData();
  formData.set("image", file);

  const response = await fetch("http://localhost:3000/api/identify", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Barcode request failed.");
  }

  const payload = await response.json();

  return {
    found: payload.found as boolean,
    value: payload.value as string | null,
    format: payload.format as string | null,
    confidence: payload.confidence as number | null
  };
}
```

### Next.js server action or route handler

```ts
const formData = new FormData();
formData.set("image", file, file.name);

const response = await fetch(`${process.env.BARCODE_SCANNER_URL}/api/identify`, {
  method: "POST",
  body: formData,
  cache: "no-store"
});

const payload = await response.json();
const barcodeValue = payload.value;
```

### PHP / Laravel

```php
$response = Http::attach(
    'image',
    fopen($request->file('image')->getRealPath(), 'r'),
    $request->file('image')->getClientOriginalName()
)->post(env('BARCODE_SCANNER_URL') . '/api/identify');

$payload = $response->json();
$barcodeValue = $payload['value'] ?? null;
```

### Python

```python
import requests

with open("barcode.jpg", "rb") as image_file:
    response = requests.post(
        "http://localhost:3000/api/identify",
        files={"image": ("barcode.jpg", image_file, "image/jpeg")},
        timeout=15,
    )

payload = response.json()
barcode_value = payload.get("value")
```

## Recommended Usage in Other Apps

Use the top-level `value` field as the primary decoded barcode.

Use `results` only if:

- you want to inspect all matches
- you want confidence details
- you plan to support multi-barcode logic later

Recommended handling:

1. If `found` is `false`, ask the user to retake the image or improve lighting/focus.
2. If `value` is present, use it as the barcode identifier in your own app.
3. Validate barcode format in the calling app only if your business flow requires it.

## Security Notes

Current state:

- The endpoint supports two access modes on the same route.
- Free unauthenticated access is available but rate-limited.
- Registered callers can send `Authorization: Bearer <api_key>` or `X-API-Key: <api_key>`.
- Registered keys are confirmed by an external authentication service, not by static keys stored in this app.
- CORS can restrict browser callers, but CORS is not authentication.

For the recommended registration and credential model, see [API User Registration Guide](./api-user-registration.md).
For the recommended split-service design, see [API Access Architecture](./api-access-architecture.md).

If this will be used outside a trusted internal network, require one of these:

- API key
- session-based auth through a gateway app
- reverse proxy allowlist
- VPN-only/internal network access

## Performance Notes

- Maximum upload size is `2 MB`
- Send clear, cropped barcode images for best results
- JPEG is acceptable for mobile uploads
- Very blurry, reflective, or distant images may return no result

## Deployment Checklist

1. Deploy this scanner app to a reachable URL.
2. Set `BARCODE_DECODER_URL` correctly.
3. Set `BARCODE_API_ALLOWED_ORIGINS` for allowed browser callers.
4. Confirm `/api/health` returns `200`.
5. Test `/api/identify` with a real barcode image before integrating into another app.

## Suggested Architecture

For most teams, the cleanest setup is:

1. Keep this project deployed as a dedicated barcode service.
2. Let other applications send barcode images to this service.
3. Let those applications own the business logic after receiving the decoded `value`.

That keeps barcode decoding isolated from inventory, catalog, or receiving logic.
