const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DECODER_URL = process.env.BARCODE_DECODER_URL ?? "http://127.0.0.1:8000";
const DEFAULT_ALLOWED_METHODS = "GET,POST,OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-API-Key";
const DEFAULT_FREE_TIER_REQUESTS_PER_MINUTE = 10;

type AccessMode = "free" | "authenticated";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface DecoderResult {
  value?: string;
  format?: string;
  confidence?: number;
}

interface DecoderPayload {
  results?: DecoderResult[];
}

interface AuthValidationPayload {
  valid?: boolean;
  consumerId?: string;
  consumerName?: string;
  status?: string;
}

export interface PublicDecodePayload {
  found: boolean;
  value: string | null;
  format: string | null;
  confidence: number | null;
  results: DecoderResult[];
}

const freeTierRequests = new Map<string, RateLimitEntry>();

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

function getAuthValidationUrl(): string {
  const authServiceUrl = process.env.BARCODE_AUTH_SERVICE_URL?.trim() ?? "";
  const authServiceValidatePath = process.env.BARCODE_AUTH_SERVICE_VALIDATE_PATH?.trim() ?? "/api/keys/validate";

  if (!authServiceUrl) {
    return "";
  }

  return new URL(authServiceValidatePath, authServiceUrl).toString();
}

function getAuthServiceSharedSecret(): string {
  return process.env.BARCODE_AUTH_SERVICE_SHARED_SECRET?.trim() ?? "";
}

function getFreeTierLimit(): number {
  const rawLimit = process.env.FREE_TIER_REQUESTS_PER_MINUTE?.trim();
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : Number.NaN;

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_FREE_TIER_REQUESTS_PER_MINUTE;
  }

  return parsedLimit;
}

function getPresentedApiKey(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(/\s+/, 2);
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token;
    }
  }

  const apiKey = request.headers.get("x-api-key")?.trim();
  return apiKey ? apiKey : null;
}

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  return "anonymous";
}

function appendRateLimitHeaders(headers: Headers, remaining: number, resetAt: number): void {
  headers.set("X-RateLimit-Limit", String(getFreeTierLimit()));
  headers.set("X-RateLimit-Remaining", String(Math.max(remaining, 0)));
  headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
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

function jsonResponseWithHeaders(request: Request, body: unknown, headers: Headers, status = 200): Response {
  const responseHeaders = createCorsHeaders(request);
  headers.forEach((value, key) => responseHeaders.set(key, value));
  responseHeaders.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
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

async function validateApiKeyWithAuthService(
  request: Request,
  apiKey: string
): Promise<{ valid: true } | Response> {
  const validationUrl = getAuthValidationUrl();
  if (!validationUrl) {
    return jsonResponse(
      request,
      { error: "Authentication service is not configured for registered API access." },
      503
    );
  }

  const headers = new Headers({
    "Content-Type": "application/json"
  });

  const authServiceSharedSecret = getAuthServiceSharedSecret();
  if (authServiceSharedSecret) {
    headers.set("X-Scanner-Service-Secret", authServiceSharedSecret);
  }

  try {
    const response = await fetch(validationUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        apiKey,
        origin: request.headers.get("origin"),
        endpoint: "/api/identify"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return jsonResponse(request, { error: "Invalid API key." }, 401);
      }

      return jsonResponse(
        request,
        { error: "Authentication service is unavailable for registered API access." },
        503
      );
    }

    const payload = (await response.json()) as AuthValidationPayload;
    if (!payload.valid || payload.status === "inactive") {
      return jsonResponse(request, { error: "Invalid API key." }, 401);
    }

    return { valid: true };
  } catch {
    return jsonResponse(
      request,
      { error: "Authentication service is unavailable for registered API access." },
      503
    );
  }
}

async function resolveAccessMode(request: Request): Promise<{ mode: AccessMode; rateLimitHeaders?: Headers } | Response> {
  const presentedApiKey = getPresentedApiKey(request);

  if (presentedApiKey) {
    const validationResult = await validateApiKeyWithAuthService(request, presentedApiKey);
    if (validationResult instanceof Response) {
      return validationResult;
    }

    return { mode: "authenticated" };
  }

  const limit = getFreeTierLimit();
  const now = Date.now();
  const windowMs = 60_000;
  const clientIdentifier = getClientIdentifier(request);
  const currentEntry = freeTierRequests.get(clientIdentifier);

  if (!currentEntry || currentEntry.resetAt <= now) {
    const resetAt = now + windowMs;
    freeTierRequests.set(clientIdentifier, { count: 1, resetAt });
    const headers = new Headers();
    headers.set("X-Access-Tier", "free");
    appendRateLimitHeaders(headers, limit - 1, resetAt);
    return { mode: "free", rateLimitHeaders: headers };
  }

  if (currentEntry.count >= limit) {
    const headers = new Headers();
    headers.set("Retry-After", String(Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000))));
    headers.set("X-Access-Tier", "free");
    appendRateLimitHeaders(headers, 0, currentEntry.resetAt);
    return jsonResponseWithHeaders(
      request,
      { error: "Free tier rate limit exceeded. Retry later or use a registered API key." },
      headers,
      429
    );
  }

  currentEntry.count += 1;
  const headers = new Headers();
  headers.set("X-Access-Tier", "free");
  appendRateLimitHeaders(headers, limit - currentEntry.count, currentEntry.resetAt);
  return { mode: "free", rateLimitHeaders: headers };
}

export async function handleDecodeRequest(request: Request): Promise<Response> {
  const accessDecision = await resolveAccessMode(request);
  if (accessDecision instanceof Response) {
    return accessDecision;
  }

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
      return jsonResponseWithHeaders(
        request,
        normalizePayload({ results: [] }),
        createAccessHeaders(accessDecision.mode, accessDecision.rateLimitHeaders)
      );
    }

    const payload = (await response.json()) as DecoderPayload;
    return jsonResponseWithHeaders(
      request,
      normalizePayload(payload),
      createAccessHeaders(accessDecision.mode, accessDecision.rateLimitHeaders)
    );
  } catch {
    return jsonResponseWithHeaders(
      request,
      normalizePayload({ results: [] }),
      createAccessHeaders(accessDecision.mode, accessDecision.rateLimitHeaders)
    );
  }
}

export function createIdentifyMetadata(request: Request): Response {
  return jsonResponse(request, {
    endpoint: "/api/identify",
    method: "POST",
    contentType: "multipart/form-data",
    field: "image",
    access: {
      free: {
        authentication: "none",
        rateLimitPerMinute: getFreeTierLimit()
      },
      registered: {
        authentication: "Authorization: Bearer <api_key> or X-API-Key",
        validation: getAuthValidationUrl() || "configured via BARCODE_AUTH_SERVICE_URL + BARCODE_AUTH_SERVICE_VALIDATE_PATH",
        defaultPolicy: "unlimited after auth-service confirmation"
      }
    },
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

function createAccessHeaders(mode: AccessMode, rateLimitHeaders?: Headers): Headers {
  const headers = new Headers(rateLimitHeaders);
  headers.set("X-Access-Tier", mode);
  return headers;
}

export function resetAccessPolicyStateForTests(): void {
  freeTierRequests.clear();
}
