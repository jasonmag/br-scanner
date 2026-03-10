const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DECODER_URL = process.env.BARCODE_DECODER_URL ?? "http://127.0.0.1:8000";
const DEFAULT_ALLOWED_METHODS = "GET,POST,OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization";

interface DecoderResult {
  value?: string;
  format?: string;
  confidence?: number;
}

interface DecoderPayload {
  results?: DecoderResult[];
}

export interface PublicDecodePayload {
  found: boolean;
  value: string | null;
  format: string | null;
  confidence: number | null;
  results: DecoderResult[];
}

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.BARCODE_API_ALLOWED_ORIGINS?.trim();
  if (!rawOrigins) {
    return ["*"];
  }

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function resolveAllowedOrigin(request: Request): string {
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes("*")) {
    return "*";
  }

  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] ?? "*";
}

export function createCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", resolveAllowedOrigin(request));
  headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", DEFAULT_ALLOWED_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  const headers = createCorsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

function normalizePayload(payload: DecoderPayload): PublicDecodePayload {
  const results = (payload.results ?? []).filter((result) => typeof result.value === "string" && result.value.length > 0);
  const firstResult = results[0];

  return {
    found: Boolean(firstResult),
    value: firstResult?.value ?? null,
    format: firstResult?.format ?? null,
    confidence: typeof firstResult?.confidence === "number" ? firstResult.confidence : null,
    results
  };
}

export function createOptionsResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request)
  });
}

export async function handleDecodeRequest(request: Request): Promise<Response> {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof Blob)) {
    return jsonResponse(request, { error: "Missing image upload." }, 400);
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return jsonResponse(request, { error: "Image exceeds the 2 MB limit." }, 413);
  }

  const decoderFormData = new FormData();
  decoderFormData.set("image", image, "scan.jpg");

  try {
    const response = await fetch(`${DECODER_URL}/decode`, {
      method: "POST",
      body: decoderFormData,
      cache: "no-store"
    });

    if (!response.ok) {
      return jsonResponse(request, normalizePayload({ results: [] }));
    }

    const payload = (await response.json()) as DecoderPayload;
    return jsonResponse(request, normalizePayload(payload));
  } catch {
    return jsonResponse(request, normalizePayload({ results: [] }));
  }
}

export function createIdentifyMetadata(request: Request): Response {
  return jsonResponse(request, {
    endpoint: "/api/identify",
    method: "POST",
    contentType: "multipart/form-data",
    field: "image",
    response: {
      found: true,
      value: "sample-barcode-value",
      format: "ean_13",
      confidence: 0.88,
      results: [
        {
          value: "sample-barcode-value",
          format: "ean_13",
          confidence: 0.88
        }
      ]
    }
  });
}
