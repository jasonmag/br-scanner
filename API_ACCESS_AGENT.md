# API_ACCESS_AGENT.md

## Agent Name
Codex Build Agent - API Access Service

## Mission
Build a separate service that manages API consumer registration, credential issuance, authentication, authorization, and controlled access to the barcode scanner API.

This project exists to protect and operationalize external access to the barcode scanner platform.

## Product Goal

The API access service must:

- register consumer applications
- issue one credential per consumer application
- validate incoming credentials
- enforce consumer status and policy
- forward authorized barcode identify requests to `br-scanner`
- support credential rotation and revocation
- keep audit-friendly records of who used the API

## Core Principle

Do not mix barcode decoding responsibilities into this project.

This service is an access-control and integration boundary, not the scanner itself.

## Primary Responsibilities

### 1. Consumer Registration

The service must support registration of API consumers with:

- application name
- owner contact
- consumer type
- environment scope
- allowed origins
- active or inactive status

### 2. Credential Issuance

The service must support:

- API key generation
- secure credential storage
- one credential per consuming application
- credential rotation
- credential revocation

### 3. Request Authentication

The service must:

- accept authenticated requests from registered consumers
- reject unknown, revoked, expired, or inactive credentials
- distinguish browser and server consumers

### 4. Request Authorization

The service must be able to enforce:

- consumer active status
- allowed origin policy
- per-consumer access scope
- rate limits

### 5. Barcode API Gateway

The service must expose an endpoint that:

- accepts an image upload
- authenticates the caller
- forwards the request to the scanner service
- returns the scanner result to the caller

Preferred gateway endpoint:

- `POST /api/barcodes/identify`

The downstream scanner target is expected to be:

- `POST /api/identify` on the `br-scanner` service

## Suggested Stack

Use this stack unless a blocking reason requires a documented exception:

- Next.js or NestJS for HTTP API
- TypeScript
- PostgreSQL
- Prisma or a similarly clear ORM
- Docker
- Kamal or equivalent deploy workflow

If choosing between Next.js and NestJS:

- prefer Next.js if the team wants consistency with `br-scanner`
- prefer NestJS if the team wants a more explicit service/controller/module structure

## Required Data Model

The service should include tables or equivalent models for:

- `api_consumers`
- `api_credentials`
- `consumer_origins`
- `consumer_rate_limits`
- `api_request_logs`

Minimum `api_consumers` fields:

- `id`
- `name`
- `slug`
- `owner_email`
- `consumer_type`
- `status`
- `created_at`
- `updated_at`

Minimum `api_credentials` fields:

- `id`
- `consumer_id`
- `credential_type`
- `key_prefix`
- `key_hash`
- `expires_at`
- `revoked_at`
- `last_used_at`
- `created_at`

## Security Requirements

The service must:

- hash stored API keys
- never store raw keys after issuance
- support key rotation
- support deactivation of a consumer without deleting history
- separate public endpoints from admin endpoints
- not rely on CORS as authentication

For browser-based consumers:

- avoid permanent keys in frontend code
- prefer short-lived tokens or backend proxying

## Endpoint Expectations

Minimum public endpoints:

- `POST /api/consumers/register`
- `POST /api/tokens`
- `POST /api/barcodes/identify`
- `GET /api/health`

Minimum admin endpoints:

- `GET /api/consumers`
- `GET /api/consumers/:id`
- `POST /api/consumers/:id/credentials`
- `POST /api/consumers/:id/rotate-key`
- `POST /api/consumers/:id/activate`
- `POST /api/consumers/:id/deactivate`

## Forwarding Contract

When forwarding an identify request to `br-scanner`, this service must:

1. validate the caller credential
2. verify policy such as status and origin
3. forward the uploaded image to the scanner service
4. pass an internal trust header or use internal network protection
5. return the scanner response without changing its core barcode payload shape

Expected scanner response shape:

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

## Environment Variables

Document and support variables like:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://...
BARCODE_SCANNER_URL=http://br-scanner.internal:3000
BARCODE_SCANNER_SHARED_SECRET=replace-me
API_KEY_PEPPER=replace-me
JWT_ISSUER=api-access-service
JWT_AUDIENCE=barcode-clients
JWT_PRIVATE_KEY=replace-me
DEFAULT_REQUESTS_PER_MINUTE=60
```

If more variables are added, document all of them.

## Non-Negotiable Requirements

The system must:

- support API consumer registration
- issue unique credentials per consumer
- authenticate barcode API requests
- reject unauthorized callers
- forward authorized barcode requests to `br-scanner`
- support activation, deactivation, and key rotation
- produce health checks
- be containerized
- be deployable
- be maintainable and testable

## Acceptance Criteria

The build is acceptable only if all are true:

- a consumer can be registered
- a credential can be issued
- raw credentials are not stored after issuance
- authenticated requests can reach the barcode identify gateway
- unauthorized requests are rejected
- inactive consumers are blocked
- rotated or revoked keys stop working
- request logs capture consumer and status metadata
- Docker build succeeds
- deployment config is present
- README explains registration, authentication, and gateway usage

## Build Phases

Phase 1 - Scaffold:

- project setup
- database setup
- health route
- base README

Phase 2 - Registration:

- consumer model
- consumer CRUD
- activation and deactivation

Phase 3 - Credentials:

- API key generation
- hashing
- issuance
- rotation
- revocation

Phase 4 - Gateway:

- barcode identify endpoint
- forwarding to `br-scanner`
- internal service trust header

Phase 5 - Controls:

- origin policy
- rate limiting
- request logging

Phase 6 - Hardening:

- tests
- Docker
- deployment config
- operational docs

## Documentation Deliverables

This project must include:

- `README.md`
- registration workflow documentation
- credential rotation documentation
- gateway usage examples
- deployment notes

## Relationship To `br-scanner`

`br-scanner` remains the barcode-processing service.

This project sits in front of it and controls who is allowed to use it.
