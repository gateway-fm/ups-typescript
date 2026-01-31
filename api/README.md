# API Specification

This directory contains the API specification for the x402 UPS platform.

## Files

- `swagger.yaml` - OpenAPI 3.0.3 specification for the UPS API
- `generated/api-types.ts` - Auto-generated TypeScript types from the OpenAPI spec

## Type Generation

TypeScript types are automatically generated from the OpenAPI specification using `openapi-typescript`.

### Regenerating Types

To regenerate types after modifying `swagger.yaml`:

```bash
pnpm generate:types
```

This will:
1. Read `api/swagger.yaml`
2. Generate TypeScript interfaces and types
3. Output to `api/generated/api-types.ts`

### Usage

The generated types can be imported for type-safe API interactions:

```typescript
import type { components, operations } from '@/api/generated/api-types';

// Access schema types
type User = components['schemas']['User'];
type Account = components['schemas']['Account'];

// Access operation request/response types
type ConnectRequest = components['schemas']['ConnectRequest'];
type ConnectResponse = components['schemas']['ConnectResponse'];
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/connect` | **Recommended** - Unified auth (creates user if new, authenticates if existing) |
| POST | `/auth/refresh` | Refresh session token |
| POST | `/auth/login` | ⚠️ Deprecated - Use `/auth/connect` |
| POST | `/auth/register` | ⚠️ Deprecated - Use `/auth/connect` |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current authenticated user profile |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List user's smart accounts |
| POST | `/accounts` | Create a new smart account |
| GET | `/accounts/{id}` | Get account by ID |
| POST | `/accounts/predict` | Predict smart account address before deployment |

### x402 Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/x402/verify` | Verify payment signature |
| POST | `/x402/settle` | Settle payment on-chain |
| GET | `/x402/supported` | Get supported payment schemes |

## Response Format

All API responses use **snake_case** field naming. The SDK automatically maps these to camelCase for a better TypeScript developer experience.

### Example Response Mapping

API Response (snake_case):
```json
{
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "is_new_user": false
}
```

SDK Type (camelCase):
```typescript
interface ConnectResult {
  user: {
    id: string;
    walletAddress: string;
    createdAt: string;
  };
  isNewUser: boolean;
}
```

## Schema Version

The API uses OpenAPI 3.0.3 specification format. The original Swagger 2.0 format was converted for compatibility with modern tooling.
