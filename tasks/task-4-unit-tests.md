# Task 4: Unit Tests

## Objective
Create comprehensive unit tests for the SDK core library and React hooks using Vitest and MSW.

## Prerequisites
- Task 1 completed and approved
- Task 2 completed and approved
- Task 3 completed and approved

---

## 4.1 Test Setup

### Install Additional Dependencies
```bash
pnpm add -D msw @testing-library/react @testing-library/jest-dom jsdom
```

### Update vitest.config.ts
```typescript
// Add jsdom environment for React tests
test: {
  environment: 'jsdom',
  setupFiles: ['./test/setup.ts'],
  globals: true,
}
```

### Create test/setup.ts
```typescript
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Create test/mocks/server.ts
Setup MSW mock server with handlers for all API endpoints.

### Create test/mocks/handlers.ts
Define request handlers:
- `POST /auth/connect` → mock auth response
- `POST /auth/refresh` → mock refresh response
- `POST /accounts` → mock account creation
- `POST /accounts/predict` → mock address prediction
- `GET /accounts` → mock account list
- `POST /x402/verify` → mock verify response
- `POST /x402/settle` → mock settle response

---

## 4.2 SDK Unit Tests

### test/sdk/http-client.test.ts

**Test Cases:**
1. `should make GET request with correct headers`
2. `should make POST request with JSON body`
3. `should include auth token when available`
4. `should skip auth when skipAuth option is true`
5. `should retry on network error`
6. `should handle 429 rate limiting with backoff`
7. `should throw AuthError on 401`
8. `should throw NetworkError on timeout`
9. `should respect AbortController signal`

### test/sdk/auth-manager.test.ts

**Test Cases:**
1. `should start in unauthenticated state`
2. `should authenticate with valid credentials`
3. `should store token and expiry after authentication`
4. `should emit auth:changed event on authentication`
5. `should refresh token before expiry`
6. `should logout and clear state`
7. `should emit auth:changed event on logout`
8. `should return null token when not authenticated`

### test/sdk/event-bus.test.ts

**Test Cases:**
1. `should emit events to subscribers`
2. `should support multiple subscribers for same event`
3. `should unsubscribe correctly`
4. `should handle once() for one-time subscriptions`
5. `should clear all listeners on clear()`

### test/sdk/wallet-module.test.ts

**Test Cases:**
1. `should start in disconnected state`
2. `should connect to EIP-1193 provider`
3. `should get address after connection`
4. `should get chainId after connection`
5. `should sign message using provider`
6. `should sign typed data (EIP-712)`
7. `should handle user rejection (code 4001)`
8. `should emit wallet:connected event`
9. `should disconnect and clear state`
10. `should handle accountsChanged event`
11. `should handle chainChanged event`

**Mock Provider:**
Create a mock EIP-1193 provider for testing:
```typescript
const createMockProvider = (options?: {
  accounts?: string[];
  chainId?: number;
  signMessageResult?: string;
  signTypedDataResult?: string;
}) => ({
  request: vi.fn(async ({ method }) => {
    switch (method) {
      case 'eth_requestAccounts': return options?.accounts ?? ['0x123...'];
      case 'eth_chainId': return `0x${(options?.chainId ?? 84532).toString(16)}`;
      // ... etc
    }
  }),
  on: vi.fn(),
  removeListener: vi.fn(),
});
```

### test/sdk/account-module.test.ts

**Test Cases:**
1. `should create account with owner and salt`
2. `should return account and txHash from creation`
3. `should predict address before deployment`
4. `should list accounts for authenticated user`
5. `should get account by ID`
6. `should get account by wallet address`
7. `should handle API errors correctly`

### test/sdk/payment-module.test.ts

**Test Cases:**
1. `should build authorization with correct fields`
2. `should generate random nonce`
3. `should set validAfter and validBefore correctly`
4. `should sign authorization with wallet`
5. `should encode payment header as base64`
6. `should verify payment via API`
7. `should settle payment via API`
8. `should execute full pay() flow`
9. `should throw PaymentError on verify failure`
10. `should throw PaymentError on settle failure`

### test/sdk/client.test.ts

**Test Cases:**
1. `should initialize with valid config`
2. `should parse chainId from network string`
3. `should connect wallet`
4. `should authenticate after connection`
5. `should disconnect and cleanup`
6. `should destroy and clear resources`

---

## 4.3 React Hooks Unit Tests

### test/react/provider.test.tsx

**Test Cases:**
1. `should provide UPS context to children`
2. `should initialize SDK client`
3. `should throw error when useUPSClient called outside provider`
4. `should cleanup on unmount`

### test/react/use-wallet.test.tsx

**Test Cases:**
1. `should return initial disconnected state`
2. `should connect and update state`
3. `should disconnect and reset state`
4. `should return correct isPending during connect`
5. `should return error on connection failure`

### test/react/use-auth.test.tsx

**Test Cases:**
1. `should return initial unauthenticated state`
2. `should authenticate and update state`
3. `should logout and reset state`
4. `should return isPending during authentication`

### test/react/use-account.test.tsx

**Test Cases:**
1. `useAccounts should fetch and return accounts`
2. `useAccount should fetch account by ID`
3. `useCreateAccount should create account`
4. `useCreateAccount should update currentAccount in store`
5. `usePredictAddress should return predicted address`
6. `generateSalt should return valid 32-byte hex`

### test/react/use-payment.test.tsx

**Test Cases:**
1. `usePayment should execute full payment flow`
2. `usePayment should return isPending during payment`
3. `usePayment should return error on failure`
4. `usePayment should return result on success`

---

## 4.4 Test Utilities

### Create test/utils/render.tsx
Wrapper for rendering React components with providers:
```typescript
function renderWithProviders(ui: ReactElement, options?: {
  config?: Partial<UPSConfig>;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <UPSProvider config={{ baseUrl: 'http://test', network: 'eip155:84532', ...options?.config }}>
        {ui}
      </UPSProvider>
    </QueryClientProvider>
  );
}
```

### Create test/fixtures/index.ts
Test data fixtures:
```typescript
export const mockAccount: Account = {
  id: 'acc_123',
  ownerAddress: '0x1234...',
  walletAddress: '0xabcd...',
  accountType: 'USER',
  status: 'active',
  kycLevel: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockPaymentRequirements: PaymentRequirements = {
  scheme: 'exact',
  network: 'eip155:84532',
  maxAmountRequired: '10000000',
  asset: '0xtoken...',
  payTo: '0xmerchant...',
  maxTimeoutSeconds: 3600,
  extra: { name: 'x402 Payment Token', version: '1' },
};
```

---

## Acceptance Criteria

- [ ] All tests pass with `pnpm test`
- [ ] Coverage report shows >80% coverage for SDK package
- [ ] Coverage report shows >80% coverage for React package
- [ ] MSW handlers cover all API endpoints
- [ ] No flaky tests (run 3x to verify)
- [ ] Tests are well-organized and documented

## Verification Commands
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test packages/sdk/test/http-client.test.ts

# Run in watch mode
pnpm test --watch
```
