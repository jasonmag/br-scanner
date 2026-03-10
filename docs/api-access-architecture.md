# API Access Architecture

## Goal

Split the platform into two services:

1. `br-scanner`
   - receives an image
   - decodes barcode content
   - returns barcode results

2. `api-access-service`
   - registers API consumers
   - issues credentials
   - validates tokens or API keys
   - applies policy such as status, allowed origins, and rate limits

This keeps barcode decoding separate from identity, access control, and API consumer lifecycle management.

## Recommended Topology

```text
Client App
   |
   | 1. register / obtain credentials
   v
API Access Service
   |
   | 2. authenticated request
   v
Barcode Scanner API
   |
   | 3. internal decode call
   v
Python Decoder Service
```

## Services

### 1. Barcode Scanner Service

Current responsibility:

- expose `/api/identify`
- validate image payload shape and size
- call the internal decoder
- return barcode data

It should not own:

- app registration UI
- API key issuance
- token minting
- consumer suspension
- rate limit administration

### 2. API Access Service

New responsibility:

- register consumer applications
- issue API keys or short-lived tokens
- authenticate incoming client requests
- authorize use of the barcode API
- track client status and origin policy
- log usage metadata
- support credential rotation and revocation

## Recommended Request Flow

### Option A: Gateway pattern

Best default choice.

```text
Consumer App -> API Access Service -> Barcode Scanner API
```

Flow:

1. Consumer app sends image and credential to the API access service.
2. API access service authenticates the consumer.
3. API access service enforces status, origin rules, and rate limits.
4. API access service forwards the request to `br-scanner`.
5. API access service returns the scanner response to the consumer.

Advantages:

- scanner stays private
- scanner does not need token validation logic
- easier audit and rate limiting
- easier rollout of future APIs behind the same gateway

### Option B: Direct-call with token validation

```text
Consumer App -> Barcode Scanner API
                  |
                  -> validates JWT/API key against API Access Service
```

Use this only if you need direct consumer access to the scanner service.

Tradeoff:

- lower hop count
- but more auth logic leaks into the scanner app

## Recommendation

Use Option A first.

That means:

- `api-access-service` is the public entry point
- `br-scanner` is reachable only from trusted internal network paths

## Consumer Types

Support these consumer types:

- `server_app`
- `browser_app`
- `internal_tool`

Each consumer should have:

- unique id
- display name
- owner contact
- status
- environment scope
- allowed origins
- authentication credentials
- created and rotated timestamps

## Suggested Data Model

### `api_consumers`

```text
id
name
slug
owner_email
consumer_type
status
notes
created_at
updated_at
disabled_at
```

### `api_credentials`

```text
id
consumer_id
credential_type
key_prefix
key_hash
last_used_at
expires_at
revoked_at
created_at
rotated_from_id
```

### `consumer_origins`

```text
id
consumer_id
origin
created_at
```

### `consumer_rate_limits`

```text
id
consumer_id
requests_per_minute
burst_limit
created_at
updated_at
```

### `api_request_logs`

```text
id
consumer_id
path
method
status_code
request_id
origin
ip_address
created_at
latency_ms
```

## Authentication Model

### Phase 1

Use API keys.

Request header:

```text
Authorization: Bearer <api_key>
```

Server behavior:

1. extract key
2. hash it
3. compare against stored credential hash
4. verify credential is active and not expired
5. load consumer record and policy

### Phase 2

Add short-lived JWT access tokens minted by the access service.

Use cases:

- browser-safe short-lived sessions
- internal apps needing delegated access

### Phase 3

Add scoped credentials if needed:

- `barcode:identify`
- `consumer:read`
- `credential:rotate`

## Browser Integration Policy

For browser-based consumer apps:

- do not embed long-lived API keys in frontend code
- prefer routing requests through the consumer app backend
- if direct browser access is unavoidable, issue short-lived tokens from the consumer backend
- enforce allowed origins in the access service

## Rate Limiting

Apply rate limiting in the API access service, not in the scanner service.

Why:

- central policy enforcement
- easier per-consumer throttling
- protects the scanner from abuse

Suggested initial policy:

- default per consumer: `60 requests/minute`
- configurable burst limit

## Deployment Model

### Public edge

- expose `api-access-service` publicly
- terminate TLS there or at the reverse proxy

### Internal network

- keep `br-scanner` internal if possible
- allow requests only from `api-access-service`

### Internal decoder

- `decoder_service` remains private to `br-scanner`

## Recommended Environment Variables

### `api-access-service`

```env
DATABASE_URL=postgres://...
API_ACCESS_PORT=4000
BARCODE_SCANNER_URL=http://br-scanner.internal:3000
BARCODE_SCANNER_SHARED_SECRET=replace-me
API_KEY_PEPPER=replace-me
JWT_ISSUER=api-access-service
JWT_AUDIENCE=barcode-clients
JWT_PRIVATE_KEY=replace-me
DEFAULT_REQUESTS_PER_MINUTE=60
```

### `br-scanner`

```env
BARCODE_DECODER_URL=http://127.0.0.1:8000
BARCODE_API_ALLOWED_ORIGINS=
INTERNAL_ACCESS_SHARED_SECRET=replace-me
```

If using the gateway pattern, `BARCODE_API_ALLOWED_ORIGINS` can often remain empty because browsers should hit the access service, not the scanner directly.

## Internal Trust Between Services

If `api-access-service` forwards requests to `br-scanner`, protect that hop.

Options:

- internal network allowlist
- shared secret header between services
- mutual TLS later if needed

Suggested request header:

```text
X-Internal-Service-Secret: <shared_secret>
```

## Initial Endpoint Set For `api-access-service`

Public:

- `POST /api/consumers/register`
- `POST /api/tokens`
- `POST /api/barcodes/identify`

Admin:

- `GET /api/consumers`
- `GET /api/consumers/:id`
- `POST /api/consumers/:id/credentials`
- `POST /api/consumers/:id/rotate-key`
- `POST /api/consumers/:id/deactivate`
- `POST /api/consumers/:id/activate`

Internal:

- `GET /api/health`

## First Implementation Scope

Build the minimum viable access layer with:

1. consumer registration record
2. API key issuance
3. API key validation
4. request forwarding to `br-scanner /api/identify`
5. consumer activation and deactivation
6. basic request logging

Do not start with:

- OAuth
- SSO
- full self-service admin UI
- complicated tenant hierarchies

## Why This Split Is Better

- simpler scanner service
- cleaner security boundary
- easier future integrations
- better observability and control
- registration logic can evolve without risking barcode decode stability
