# AGENTS.md

> **AI Agent Project Entry Point**
> This file provides comprehensive context for AI agents working on the UPS x402 SDK monorepo.

---

## 1. Project Overview

| Field | Value |
| :--- | :--- |
| **Name** | Universal Payments SDK (UPS) for x402 Protocol |
| **Type** | TypeScript Monorepo (pnpm workspaces) |
| **Purpose** | SDK and React bindings for the x402 Universal Payments Protocol |
| **Key Features** | Smart Accounts, EIP-3009 Payment Streams, EIP-712 Typed Signatures |
| **Node Version** | `>= 18` (Node 20 recommended) |
| **Package Manager** | `pnpm` (required, do not use npm or yarn) |

---

## 2. Repository Structure

```
UPSclient/
├── api/                         # API specification & generated types
│   ├── swagger.yaml             # OpenAPI 3.0 spec
│   ├── generated/               # Auto-generated code
│   │   └── api-types.ts         # Generated TypeScript types
│   └── README.md                # API documentation
├── packages/
│   ├── sdk/                    # @x402-ups/sdk - Core SDK
│   ├── react/                  # @x402-ups/react - React hooks
│   └── test-utils/             # @x402-ups/test-utils - Testing utilities
├── examples/
│   ├── basic/                  # Node.js example
│   └── react-app/              # React/Vite example
├── .github/workflows/          # CI/CD workflows
├── test/                       # Root test configuration
├── vitest.config.ts            # Test configuration
└── package.json                # Monorepo root
```

### Package Details

| Package | Path | Description | Exports |
| :--- | :--- | :--- | :--- |
| `@x402-ups/sdk` | `packages/sdk` | Core SDK with wallet, account, and payment modules | `., ./wallet, ./account, ./payment` |
| `@x402-ups/react` | `packages/react` | React hooks and context provider | `.` |
| `@x402-ups/test-utils` | `packages/test-utils` | Mock providers and test utilities | `.` |

---

## 3. SDK Architecture (`@x402-ups/sdk`)

### 3.1 Entry Point: `UPSClient`

The main class that orchestrates all SDK functionality.

```typescript
import { UPSClient } from '@x402-ups/sdk';

const client = new UPSClient({
    baseUrl: 'https://api.ups.example.com',
    network: 'eip155:84532',  // CAIP-2 format
    timeout: 30000,
    retryAttempts: 3
});

// Connect wallet
await client.connect(window.ethereum);

// Authenticate (unified flow - creates user if new, authenticates if existing)
const result = await client.authenticate();
console.log(result.isNewUser); // true if new user was created

// Access modules
client.wallet   // WalletModule
client.account  // AccountModule
client.payment  // PaymentModule
client.user     // UserModule (new)
client.auth     // AuthManager
```

### 3.2 Core Modules

#### `WalletModule` (`packages/sdk/src/wallet/index.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `connect` | `(provider: EIP1193Provider) => Promise<ConnectedWallet>` | Connect to wallet via EIP-1193 provider |
| `disconnect` | `() => Promise<void>` | Disconnect wallet, clear state |
| `signMessage` | `(message: string) => Promise<string>` | Sign personal message |
| `signTypedData` | `(typedData: EIP712TypedData) => Promise<string>` | Sign EIP-712 typed data |
| `switchChain` | `(chainId: number) => Promise<void>` | Request chain switch |
| `getAddress` | `() => string \| null` | Get connected address |
| `isConnected` | `() => boolean` | Check connection status |
| `onStateChange` | `(callback) => () => void` | Subscribe to state changes (returns unsubscribe fn) |

**Supported Chains:** Mainnet, Base, Base Sepolia (via `viem/chains`)

#### `AccountModule` (`packages/sdk/src/account/index.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `get` | `(id: string) => Promise<Account>` | Get account by ID |
| `getByWallet` | `(address: string) => Promise<Account>` | Get account by wallet address |
| `list` | `() => Promise<Account[]>` | List all user accounts |
| `create` | `(params: CreateAccountParams) => Promise<CreateAccountResponse>` | Create new smart account |
| `predictAddress` | `(params) => Promise<string>` | Predict smart account address before creation |

**Account Types:** `USER`, `CARD`
**Account Statuses:** `pending`, `kyc_in_progress`, `active`, `frozen`, `closed`

#### `PaymentModule` (`packages/sdk/src/payment/index.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `pay` | `(request) => Promise<SettleResponse>` | Full payment flow (build → sign → verify → settle) |
| `buildAuthorization` | `(requirements, from) => PaymentAuthorization` | Build EIP-3009 authorization |
| `signAuthorization` | `(auth, requirements) => Promise<SignedAuthorization>` | Sign authorization with EIP-712 |
| `encodePaymentHeader` | `(signed, requirements) => string` | Encode as `x402` HTTP header |
| `verify` | `(signed, requirements) => Promise<VerifyResponse>` | Verify payment with backend |
| `settle` | `(signed, requirements) => Promise<SettleResponse>` | Settle payment on-chain |
| `getSupportedSchemes` | `() => Promise<SupportedSchemesResponse>` | Get supported payment schemes from facilitator |

#### `UserModule` (`packages/sdk/src/user/index.ts`) [NEW]

| Method | Signature | Description |
| :--- | :--- | :--- |
| `getCurrentUser` | `() => Promise<User>` | Get current authenticated user profile |

### 3.3 Core Services

| Service | File | Purpose |
| :--- | :--- | :--- |
| `HttpClient` | `core/http-client.ts` | HTTP client with retry, timeout, auth header injection |
| `EventBus` | `core/event-bus.ts` | Pub/sub event system for state synchronization |
| `AuthManager` | `core/auth-manager.ts` | JWT token management with unified `connect()` method |

### 3.4 Type Definitions

Key types are in `packages/sdk/src/types/index.ts`:

```typescript
// Configuration
interface UPSConfig { baseUrl, network, chainId?, timeout?, retryAttempts? }

// Wallet
type EIP1193Provider = { request, on?, removeListener? }
interface WalletState { isConnected, address, chainId, provider }
interface ConnectedWallet { address, chainId, provider }

// User (from /auth/connect and /users/me)
interface User { id, walletAddress, status, createdAt }
interface ConnectResult { user, token, expiresAt, isNewUser }

// Account
interface Account { id, ownerAddress, walletAddress, accountType, status, kycLevel, userId?, createdAt, updatedAt? }
interface CreateAccountParams { ownerAddress, salt }

// Payment (x402)
interface PaymentRequirements { scheme, network, maxAmountRequired, asset, payTo, maxTimeoutSeconds, resource?, description?, extra?, from? }
interface PaymentAuthorization { from, to, value, validAfter, validBefore, nonce }
interface SignedAuthorization extends PaymentAuthorization { signature }
interface SupportedScheme { x402Version, scheme, network }
interface SupportedSchemesResponse { kinds: SupportedScheme[] }

// EIP-712
interface EIP712TypedData { domain, types, primaryType, message }
```

### 3.5 Error Classes

All in `packages/sdk/src/core/errors.ts`:
- `WalletError` - Wallet connection/signing failures
- `PaymentError` - Payment flow failures
- `AuthError` - Authentication failures
- `RequestError` - HTTP request failures

---

## 4. React Integration (`@x402-ups/react`)

### 4.1 Provider Setup

```tsx
import { UPSProvider } from '@x402-ups/react';

function App() {
    const config = { baseUrl: '...', network: 'eip155:84532' };
    return (
        <UPSProvider config={config}>
            <YourApp />
        </UPSProvider>
    );
}
```

### 4.2 Hooks Reference

| Hook | Returns | Purpose |
| :--- | :--- | :--- |
| `useUPSClient` | `UPSClient` | Access the SDK client instance |
| `useUPSContext` | `{ client, isInitialized }` | Access context with initialization state |
| `useWallet` | `{ connect, disconnect, state, ... }` | Wallet operations |
| `useAuth` | `{ isAuthenticated, authenticate, ... }` | Authentication state & actions |
| `useAccount` | `{ accounts, createAccount, ... }` | Account management with TanStack Query |
| `usePayment` | `{ pay, isPaying, ... }` | Payment execution |

### 4.3 State Management

**Zustand Store** (`packages/react/src/store.ts`):
```typescript
interface UPSStore {
    client: UPSClient | null;
    walletState: WalletState;
    authState: AuthState;
    currentAccount: Account | null;
}
```

The store is automatically synced with SDK state via `EventBus` subscriptions in `UPSProvider`.

---

## 5. Development Commands

Run all commands from the **repository root**:

| Command | Purpose |
| :--- | :--- |
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages (tsup → dist/) |
| `pnpm dev` | Watch mode for development |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Lint all packages (ESLint) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Remove node_modules and dist |

### Package-Specific Commands

```bash
# Run E2E tests (in packages/sdk)
cd packages/sdk && pnpm test:e2e
```

---

## 6. Environment Configuration

### Required Variables

Create `.env` in the root (see `SECRETS.md` for handling sensitive data):

```bash
# API Configuration
API_BASE_URL=https://api.ups.example.com

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_CHAIN_ID=84532
BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS=0x...

# Testing Only
TEST_PRIVATE_KEY=0x...  # Never commit real keys
```

### E2E Test Environment

E2E tests require the backend services running. Set these for CI:
- `API_BASE_URL` - UPS API gateway
- `BLOCKCHAIN_RPC_URL` - RPC endpoint
- `BLOCKCHAIN_CHAIN_ID` - Chain ID
- `BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS` - ERC-20 token with EIP-3009 support
- `TEST_PRIVATE_KEY` - Funded test wallet key

---

## 7. CI/CD Pipelines

### Workflows (`.github/workflows/`)

| Workflow | Trigger | Jobs |
| :--- | :--- | :--- |
| `ci.yml` | Push/PR to `main` | lint, build, test, e2e (main only) |
| `pr.yml` | Pull requests | Bundle size validation |
| `release.yml` | Manual/tag | Publish to npm |

### CI Job Details

```yaml
# ci.yml jobs:
lint:     pnpm lint, pnpm typecheck
build:    pnpm build → uploads dist/ as artifact
test:     pnpm test:coverage → Codecov upload
e2e:      pnpm test:e2e (main branch only, requires secrets)
```

### Required GitHub Secrets

| Secret | Purpose |
| :--- | :--- |
| `CODECOV_TOKEN` | Coverage upload |
| `NPM_TOKEN` | npm publishing |
| `API_BASE_URL` | E2E API endpoint |
| `BLOCKCHAIN_RPC_URL` | E2E blockchain RPC |
| `BLOCKCHAIN_CHAIN_ID` | E2E chain ID |
| `BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS` | E2E payment token |
| `TEST_PRIVATE_KEY` | E2E test wallet |

---

## 8. Testing Patterns

### Unit Tests

- **Framework:** Vitest
- **Location:** `packages/*/test/**/*.test.ts` or co-located `*.test.ts`
- **Mocking:** Use `vi.mock()` for external dependencies

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('WalletModule', () => {
    it('connects successfully', async () => {
        const mockProvider = { request: vi.fn() };
        // ... test logic
    });
});
```

### E2E Tests

- **Location:** `packages/sdk/test/e2e/`
- **Configuration:** `vitest.e2e.config.ts`
- **Requirements:** Running backend services, funded test wallet

### Mock Patterns

```typescript
// Mock EIP-1193 Provider
const mockProvider = {
    request: vi.fn().mockImplementation(({ method }) => {
        if (method === 'eth_requestAccounts') return ['0x...'];
        if (method === 'eth_chainId') return '0x14a34';
    }),
    on: vi.fn(),
};

// Mock HTTP responses
vi.mock('../core/http-client', () => ({
    HttpClient: vi.fn().mockImplementation(() => ({
        get: vi.fn(),
        post: vi.fn(),
    })),
}));
```

---

## 9. Code Conventions

### File Organization

- **Source:** `src/` in each package
- **Exports:** Single `index.ts` at package root re-exports public API
- **Modules:** Each module in own directory with `index.ts`

### Naming Conventions

| Type | Convention | Example |
| :--- | :--- | :--- |
| Files | `kebab-case.ts` | `http-client.ts` |
| Classes | `PascalCase` | `WalletModule` |
| Interfaces | `PascalCase` | `UPSConfig` |
| Functions | `camelCase` | `buildAuthorization` |
| Constants | `UPPER_SNAKE_CASE` | `DEFAULT_TIMEOUT` |

### Build Configuration

- **Bundler:** tsup (ESM + CJS dual output)
- **Target:** ES2020
- **TypeScript:** Strict mode enabled

---

## 10. Examples

### Basic Node.js Example (`examples/basic/`)

```typescript
import { UPSClient } from '@x402-ups/sdk';
import { createWalletClient, http } from 'viem';

const client = new UPSClient({ baseUrl: '...', network: 'eip155:84532' });
// Connect, authenticate, create accounts (buyer/merchant), fund buyer, make payment
```

### React Example (`examples/react-app/`)

Demonstrates full React integration with hooks and TanStack Query.

---

## 11. Common Tasks for AI Agents

### Adding a New SDK Method

1. Add type definitions in `packages/sdk/src/types/index.ts`
2. Implement in the relevant module (`wallet/`, `account/`, `payment/`)
3. Export from `packages/sdk/src/index.ts` if public
4. Add unit tests
5. Update React hooks if needed

### Adding a New React Hook

1. Create `packages/react/src/hooks/use-{name}.ts`
2. Export from `packages/react/src/hooks/index.ts`
3. Re-export from `packages/react/src/index.ts`
4. Add tests with `@testing-library/react`

### Debugging Test Failures

```bash
# Run specific test file
pnpm test -- packages/sdk/test/wallet.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose

# Check types
pnpm typecheck
```

### Fixing Lint Errors

```bash
pnpm lint          # See all errors
pnpm lint -- --fix # Auto-fix where possible
```

---

## 12. Related Documentation

| File | Purpose |
| :--- | :--- |
| `SECRETS.md` | How to handle sensitive configuration |
| `examples/README.md` | Running the example applications |
| `packages/*/README.md` | Package-specific documentation |

---

## 13. Key Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `viem` | `^2.21.0` | Ethereum interactions, EIP-712 signing |
| `zustand` | `^4.5.0` | React state management |
| `@tanstack/react-query` | `^5.0.0` | Async state in React |
| `tsup` | `^8.0.0` | Bundling |
| `vitest` | `^4.0.18` | Testing |

---

*Last updated: 2026-01-31*
