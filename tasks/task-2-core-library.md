# Task 2: Core Library (@x402-ups/sdk)

## Objective
Implement the core SDK modules for account creation and B2C payment flows.

## Prerequisites
- Task 1 completed and approved

---

## 2.1 Type Definitions (src/types/index.ts)

Define the following types and interfaces:

### Configuration
```typescript
interface UPSConfig {
  baseUrl: string;           // API base URL
  network: string;           // CAIP-2 format: "eip155:84532"
  chainId?: number;          // Optional, parsed from network if not provided
  timeout?: number;          // Request timeout (default: 30000)
  retryAttempts?: number;    // Retry count (default: 3)
}
```

### Authentication
```typescript
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: Date | null;
  address: string | null;
}

interface AuthResult {
  token: string;
  expiresAt: string;
}
```

### Wallet
```typescript
type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: Function) => void;
  removeListener?: (event: string, handler: Function) => void;
};

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: EIP1193Provider | null;
}

interface ConnectedWallet {
  address: string;
  chainId: number;
  provider: EIP1193Provider;
}
```

### Account
```typescript
type AccountStatus = 'pending' | 'kyc_in_progress' | 'active' | 'frozen' | 'closed';
type AccountType = 'USER' | 'CARD';

interface Account {
  id: string;
  ownerAddress: string;
  walletAddress: string;
  accountType: AccountType;
  status: AccountStatus;
  kycLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateAccountParams {
  ownerAddress: string;
  salt: string;  // 0x-prefixed 32-byte hex
}

interface CreateAccountResponse {
  account: Account;
  txHash: string;
}
```

### Payment (x402)
```typescript
interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: { name?: string; version?: string };
  from?: string;
}

interface PaymentAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: number;
  validBefore: number;
  nonce: string;  // bytes32 hex
}

interface SignedAuthorization extends PaymentAuthorization {
  signature: string;
}

interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
}

interface SettleResponse {
  success: boolean;
  error?: string;
  txHash?: string;
  networkId?: string;
}
```

### Errors
Create custom error classes:
- `UPSError` - Base error with code and details
- `NetworkError` - Network/timeout failures
- `AuthError` - Authentication failures
- `WalletError` - Wallet connection/signing failures
- `PaymentError` - Payment verification/settlement failures

---

## 2.2 Core - HttpClient (src/core/http-client.ts)

**Responsibilities:**
- Execute HTTP requests with proper headers
- Automatic retry with exponential backoff
- Handle rate limiting (429) responses
- JWT token injection via callback
- Request timeout handling

**Key Methods:**
```typescript
class HttpClient {
  constructor(config: { baseUrl, timeout, retryAttempts, getToken })
  request<T>(path, options): Promise<T>
  get<T>(path, options?): Promise<T>
  post<T>(path, body?, options?): Promise<T>
}
```

**Implementation Notes:**
- Use native `fetch` API
- Implement retry loop with exponential backoff (2^attempt * 1000ms)
- On 429: read `Retry-After` header or use backoff
- On 401: throw `AuthError`
- On network error: retry up to `retryAttempts`

---

## 2.3 Core - EventBus (src/core/event-bus.ts)

**Responsibilities:**
- Internal pub/sub for cross-module communication
- Type-safe event emission and subscription

**Key Methods:**
```typescript
class EventBus {
  emit<T>(event: string, payload: T): void
  on<T>(event: string, callback: (payload: T) => void): Unsubscribe
  once<T>(event: string, callback): Unsubscribe
  off(event: string, callback): void
  clear(): void
}
```

---

## 2.4 Core - AuthManager (src/core/auth-manager.ts)

**Responsibilities:**
- Manage authentication state
- Authenticate via wallet signature
- Token refresh scheduling
- Logout and cleanup

**Key Methods:**
```typescript
class AuthManager {
  get state(): AuthState
  authenticate(address, message, signature): Promise<AuthResult>
  refresh(): Promise<void>
  logout(): void
  getToken(): string | null
  isAuthenticated(): boolean
  onStateChange(callback): Unsubscribe
}
```

**API Calls:**
- `POST /auth/connect` - `{ walletAddress, message, signature }` → `{ token, expiresAt }`
- `POST /auth/refresh` - (with Bearer token) → `{ token, expiresAt }`

**Implementation Notes:**
- Schedule refresh 5 minutes before token expiry
- Emit `auth:changed` event on state changes
- Clear refresh timer on logout/destroy

---

## 2.5 Wallet Module (src/wallet/index.ts)

**Responsibilities:**
- Connect to EIP-1193 wallet providers (MetaMask)
- Sign EIP-191 personal messages
- Sign EIP-712 typed data
- Handle wallet events (accountsChanged, chainChanged, disconnect)

**Key Methods:**
```typescript
class WalletModule {
  get state(): WalletState
  connect(provider: EIP1193Provider): Promise<ConnectedWallet>
  disconnect(): Promise<void>
  getAddress(): string | null
  getChainId(): number | null
  isConnected(): boolean
  signMessage(message: string): Promise<string>
  signTypedData(typedData: EIP712TypedData): Promise<string>
  switchChain(chainId: number): Promise<void>
  onStateChange(callback): Unsubscribe
}
```

**Implementation Notes:**
- Use `viem` for wallet client creation and signing
- Import chains from `viem/chains` (mainnet, base, baseSepolia)
- Handle user rejection (code 4001) with descriptive errors
- Setup event listeners on provider for state sync
- Emit wallet events: `wallet:connected`, `wallet:disconnected`, `wallet:chainChanged`, `wallet:accountsChanged`

---

## 2.6 Account Module (src/account/index.ts)

**Responsibilities:**
- Create SmartAccount via API
- Predict wallet address before deployment
- List and retrieve accounts

**Key Methods:**
```typescript
class AccountModule {
  get(id: string): Promise<Account>
  getByWallet(address: string): Promise<Account>
  list(): Promise<Account[]>
  create(params: CreateAccountParams): Promise<CreateAccountResponse>
  predictAddress(params: { ownerAddress, salt }): Promise<string>
}
```

**API Calls:**
- `POST /accounts` - `{ owner_address, salt }` → `{ account, tx_hash }`
- `POST /accounts/predict` - `{ owner_address, salt }` → `{ wallet_address }`
- `GET /accounts` → `{ accounts: [...] }`
- `GET /accounts/{id}` → Account

**Implementation Notes:**
- All calls require authentication (JWT)
- Transform snake_case API responses to camelCase

---

## 2.7 Payment Module (src/payment/index.ts)

**Responsibilities:**
- Build EIP-3009 TransferWithAuthorization payloads
- Sign authorizations via wallet
- Verify and settle payments via x402 endpoints

**Key Methods:**
```typescript
class PaymentModule {
  pay(request: { requirements, from }): Promise<PaymentResult>
  buildAuthorization(requirements, from): PaymentAuthorization
  signAuthorization(authorization): Promise<SignedAuthorization>
  encodePaymentHeader(signed): string  // base64 encode
  verify(signed, requirements): Promise<VerifyResponse>
  settle(signed, requirements): Promise<SettleResponse>
}
```

**API Calls:**
- `POST /x402/verify` - `{ x402Version, paymentHeader, paymentRequirements }` → `{ isValid, invalidReason? }`
- `POST /x402/settle` - `{ x402Version, paymentHeader, paymentRequirements }` → `{ success, txHash?, error? }`

**EIP-712 Typed Data Structure:**
```typescript
{
  domain: {
    name: "x402 Payment Token",
    version: "1",
    chainId: number,
    verifyingContract: tokenAddress
  },
  types: {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" }
    ]
  },
  primaryType: "TransferWithAuthorization",
  message: { from, to, value, validAfter, validBefore, nonce }
}
```

**Implementation Notes:**
- Generate random 32-byte nonce using `crypto.getRandomValues()`
- validAfter = now - 60 seconds (buffer)
- validBefore = now + maxTimeoutSeconds
- Payment header = base64(JSON.stringify(signedAuthorization))
- x402 endpoints don't require auth (skipAuth: true)

---

## 2.8 Main Client (src/client.ts)

**Responsibilities:**
- Initialize all modules with shared services
- Provide unified connect/authenticate/disconnect flow

**Key Methods:**
```typescript
class UPSClient {
  readonly config: UPSConfig
  readonly wallet: WalletModule
  readonly auth: AuthManager
  readonly account: AccountModule
  readonly payment: PaymentModule
  
  connect(provider: EIP1193Provider): Promise<ConnectedWallet>
  authenticate(): Promise<void>  // Sign message + call auth.authenticate
  disconnect(): Promise<void>
  destroy(): void
}
```

**Implementation Notes:**
- Parse chainId from network string (e.g., "eip155:84532" → 84532)
- authenticate() generates message with timestamp, signs via wallet, calls auth
- destroy() cleans up timers and event listeners

---

## 2.9 Package Exports (src/index.ts)

Export all public APIs:
- `UPSClient` (default client)
- All module classes and interfaces
- All types from `types/index.ts`
- Error classes

---

## Acceptance Criteria

- [ ] `pnpm build` completes without errors
- [ ] `pnpm typecheck` passes with no type errors
- [ ] `pnpm lint` passes
- [ ] UPSClient instantiates with valid config
- [ ] WalletModule can connect to EIP-1193 provider
- [ ] WalletModule can sign messages and typed data
- [ ] AccountModule makes correct API calls
- [ ] PaymentModule builds valid EIP-712 payloads
- [ ] All exports are properly typed
