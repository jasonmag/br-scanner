# API User Registration Guide

## Purpose

If other applications will use this barcode API, they should be treated as registered API consumers.

That means:

- each consuming app is known
- each consumer gets its own credential
- access can be enabled, disabled, and rotated without affecting other consumers

## Recommended Model

Use per-application API registration.

Each external application should have:

- an application name
- an owning team or contact
- an allowed environment list such as `dev`, `staging`, `production`
- an allowed origin list if browser access is needed
- a unique API key or token
- an active or inactive status

## Minimum Registration Record

Store at least these fields for every API consumer:

```json
{
  "id": "scanner-client-001",
  "name": "Inventory Mobile App",
  "owner": "warehouse-team@example.com",
  "status": "active",
  "environments": ["production"],
  "allowedOrigins": ["https://inventory.example.com"],
  "apiKeyId": "key_01HXYZ...",
  "createdAt": "2026-03-10T00:00:00Z",
  "lastRotatedAt": "2026-03-10T00:00:00Z"
}
```

## Registration Workflow

Recommended workflow:

1. A team requests barcode API access.
2. The scanner service owner creates an API consumer record.
3. The scanner service owner issues a unique API key or token.
4. Allowed origins are recorded if browser-based use is required.
5. The consuming team receives:
   - base URL
   - endpoint path
   - authentication method
   - rate limit expectations
   - support contact
6. The consuming app stores the credential securely.
7. Access can later be rotated or revoked without affecting other apps.

## Authentication Recommendation

CORS is not authentication.

Recommended protection for this barcode API:

- Server-to-server clients: API key in header
- Browser clients: send requests through the consumer app backend when possible
- Internal-only deployments: reverse proxy allowlist plus API key

Preferred request header:

```text
Authorization: Bearer <api_key>
```

Alternative:

```text
X-API-Key: <api_key>
```

## Recommended Access Rules

For each registered consumer, support these controls:

- `active`: can call the API
- `inactive`: blocked from calling the API
- `allowed_origins`: for browser-based callers
- `rate_limit`: optional per consumer
- `last_used_at`: for audit visibility

## Key Management

Recommended practices:

1. Generate one unique key per consuming application.
2. Never share one key across multiple applications.
3. Rotate keys when an app changes ownership or a credential is exposed.
4. Revoke keys immediately when an integration is retired.
5. Store only hashed keys if a database-backed registration system is added later.

## Suggested Phased Implementation

### Phase 1

Current project baseline:

- public integration documentation
- CORS configuration
- manual registration process maintained by the service owner

### Phase 2

Next recommended enhancement:

- require API key on `/api/identify`
- maintain consumer records in configuration or database
- reject inactive or unknown consumers

### Phase 3

Operational maturity:

- self-service registration or admin panel
- key rotation support
- audit logging
- per-consumer rate limiting

## How to Apply This in Other Applications

### Server-side consumer

Best pattern:

1. Register the application with the barcode service owner.
2. Receive an API key.
3. Store the key in server environment variables.
4. Send barcode images from the app backend to the barcode API.

Example environment variable:

```env
BARCODE_SCANNER_URL=https://scanner.example.com
BARCODE_SCANNER_API_KEY=replace-with-issued-key
```

### Browser-based consumer

Preferred pattern:

1. Register the application.
2. Add the frontend origin to the consumer record.
3. Do not embed long-lived secrets in the browser if avoidable.
4. Route requests through the consumer app backend when possible.

If direct browser calls are unavoidable:

- use CORS allowlisting
- use short-lived tokens issued by the consumer backend
- avoid exposing permanent API keys in frontend code

## Operational Notes

If you keep this barcode service open without registration:

- any caller that can reach the endpoint can use it
- usage cannot be attributed reliably
- abuse and accidental overuse are harder to control

Registration should be considered part of production readiness for external integrations.

## Documentation Links

Use these documents together:

- [API Integration Guide](./api-integration-guide.md)
- [API Access Architecture](./api-access-architecture.md)
- [README](../README.md)
