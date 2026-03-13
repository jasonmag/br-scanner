import assert from "node:assert/strict";
import test from "node:test";
import {
  handleDecodeRequest,
  resetAccessPolicyStateForTests
} from "../../src/lib/server/barcodeApi";

function setAccessEnv() {
  process.env.BARCODE_AUTH_SERVICE_URL = "http://auth.local";
  process.env.BARCODE_AUTH_SERVICE_VALIDATE_PATH = "/api/keys/validate";
  process.env.FREE_TIER_REQUESTS_PER_MINUTE = "1";
}

function createImageRequest(headers: HeadersInit = {}) {
  const formData = new FormData();
  formData.set("image", new Blob(["barcode"], { type: "image/jpeg" }), "barcode.jpg");

  return new Request("http://localhost:3000/api/identify", {
    method: "POST",
    headers,
    body: formData
  });
}

test.beforeEach(() => {
  setAccessEnv();
  resetAccessPolicyStateForTests();
});

test.afterEach(() => {
  resetAccessPolicyStateForTests();
  delete process.env.BARCODE_AUTH_SERVICE_URL;
  delete process.env.BARCODE_AUTH_SERVICE_VALIDATE_PATH;
  delete process.env.BARCODE_AUTH_SERVICE_SHARED_SECRET;
  delete process.env.FREE_TIER_REQUESTS_PER_MINUTE;
});

test("rejects invalid registered api keys", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "http://auth.local/api/keys/validate") {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  const response = await handleDecodeRequest(
    createImageRequest({
      Authorization: "Bearer wrong-key"
    })
  );

  try {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Invalid API key." });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rate limits the free tier", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "http://127.0.0.1:8000/decode") {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const firstResponse = await handleDecodeRequest(
      createImageRequest({
        "X-Forwarded-For": "203.0.113.10"
      })
    );
    assert.equal(firstResponse.status, 200);
    assert.equal(firstResponse.headers.get("X-Access-Tier"), "free");

    const secondResponse = await handleDecodeRequest(
      createImageRequest({
        "X-Forwarded-For": "203.0.113.10"
      })
    );
    assert.equal(secondResponse.status, 429);
    assert.match((await secondResponse.json()).error, /rate limit exceeded/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("allows authenticated requests without the free tier limit", async () => {
  const originalFetch = globalThis.fetch;
  let authCalls = 0;
  let decoderCalls = 0;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "http://auth.local/api/keys/validate") {
      authCalls += 1;
      return new Response(JSON.stringify({ valid: true, consumerId: "scanner-client-001", status: "active" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url === "http://127.0.0.1:8000/decode") {
      decoderCalls += 1;
      return new Response(JSON.stringify({ results: [{ value: "123", format: "ean_13", confidence: 0.9 }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const firstResponse = await handleDecodeRequest(
      createImageRequest({
        Authorization: "Bearer registered-key",
        "X-Forwarded-For": "203.0.113.11"
      })
    );
    const secondResponse = await handleDecodeRequest(
      createImageRequest({
        Authorization: "Bearer registered-key",
        "X-Forwarded-For": "203.0.113.11"
      })
    );

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(firstResponse.headers.get("X-Access-Tier"), "authenticated");
    assert.equal(secondResponse.headers.get("X-Access-Tier"), "authenticated");
    assert.equal(authCalls, 2);
    assert.equal(decoderCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns 503 when the auth service is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === "http://auth.local/api/keys/validate") {
      throw new Error("connect ECONNREFUSED");
    }

    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const response = await handleDecodeRequest(
      createImageRequest({
        Authorization: "Bearer registered-key"
      })
    );

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Authentication service is unavailable for registered API access."
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
