# Task 5: Integration Tests (Full Flow)

## Overview
Create integration tests that verify complete SDK flows work correctly with mocked backend responses using MSW (Mock Service Worker).

## Prerequisites
- Tasks 1-4 completed and approved
- All unit tests passing with >80% coverage

## Deliverables

### 1. Test Infrastructure Setup

#### 1.1 Install Dependencies

Add to `packages/sdk/package.json` devDependencies:
```json
{
  "msw": "^2.3.0"
}
```

#### 1.2 MSW Setup (`packages/sdk/src/__tests__/integration/setup.ts`)

Configure MSW handlers for all API endpoints:
- `/v1/auth/connect` - Authentication
- `/v1/accounts/*` - Account operations
- `/v1/kyc/*` - KYC operations
- `/v1/invoices/*` - Invoice operations
- `/v1/cards/*` - Card operations
- `/v1/payments/*` - Payment queries
- `/x402/verify` - Payment verification
- `/x402/settle` - Payment settlement
- `/x402/supported` - Supported networks

#### 1.3 Test Fixtures (`packages/sdk/src/__tests__/integration/fixtures.ts`)

Create comprehensive fixtures:
- Mock accounts (USER and CARD types, all statuses)
- Mock payments (all types and statuses)
- Mock invoices (all statuses)
- Mock cards (all types and statuses)
- Mock KYC sessions
- Mock wallet addresses and signatures
- Mock transaction hashes and receipts

---

### 2. Full Flow Integration Tests

#### 2.1 Wallet Connection Flow (`wallet-flow.test.ts`)

Test sequence:
1. Create UPSClient instance
2. Connect to mock EIP-1193 provider
3. Verify wallet state is "connected"
4. Verify address is correctly captured
5. Verify chainId is correctly captured
6. Sign a personal message
7. Verify signature returned
8. Disconnect wallet
9. Verify wallet state is "disconnected"

Edge cases:
- User rejects connection
- Wrong network connected
- Provider emits accountsChanged
- Provider emits chainChanged

#### 2.2 Authentication Flow (`auth-flow.test.ts`)

Test sequence:
1. Connect wallet
2. Generate authentication message with timestamp
3. Sign message with wallet
4. Call authenticate endpoint
5. Verify JWT token stored
6. Verify auth state is "authenticated"
7. Make authenticated API call
8. Verify Authorization header included
9. Test token refresh
10. Logout and verify state cleared

Edge cases:
- Invalid signature
- Expired token
- Network error during auth
- Concurrent auth requests

#### 2.3 Account Creation Flow (`account-flow.test.ts`)

Test sequence:
1. Authenticate
2. Predict wallet address with owner + salt
3. Create account with predicted address
4. Verify account returned with "pending" status
5. Initiate KYC verification
6. Verify KYC session created with redirect URL
7. Simulate KYC completion webhook
8. Verify account status changed to "active"
9. Create CARD account linked to USER
10. Verify parent relationship

Edge cases:
- Duplicate account creation
- Invalid email format
- KYC rejection
- Creating CARD without active parent

#### 2.4 Payment Flow (x402) (`payment-flow.test.ts`)

Test sequence:
1. Authenticate
2. Check token balance
3. Verify sufficient balance
4. Build EIP-3009 authorization
5. Verify authorization has correct fields
6. Sign authorization with wallet
7. Call verify endpoint
8. Verify signature valid
9. Call settle endpoint
10. Verify transaction hash returned
11. Query payment by ID
12. Verify payment status "completed"

Edge cases:
- Insufficient balance
- Invalid signature
- Expired authorization (validBefore in past)
- Settlement failure
- Network congestion (retry)
- Nonce already used

#### 2.5 Invoice Flow (`invoice-flow.test.ts`)

Test sequence:
1. Authenticate as payee
2. Create invoice with payer, amount, due date
3. Verify invoice created with "draft" status
4. Send invoice
5. Verify status changed to "sent"
6. Authenticate as payer
7. View invoice
8. Verify status changed to "viewed"
9. Pay invoice
10. Verify payment created and linked
11. Verify invoice status "paid"

Edge cases:
- Update draft invoice
- Cancel invoice
- Pay already paid invoice
- Invoice past due date

#### 2.6 Card Flow (`card-flow.test.ts`)

Test sequence:
1. Authenticate
2. Create CARD account
3. Issue virtual card with spending limit
4. Verify card returned with "pending" status
5. (For physical) Activate card with last4 + expiry
6. Verify card status "active"
7. Freeze card
8. Verify status "frozen"
9. Unfreeze card
10. Verify status "active"

Edge cases:
- Issue without CARD account
- Activate already active card
- Freeze already frozen card
- Exceed spending limit

---

### 3. React Integration Tests

#### 3.1 Provider Integration (`packages/react/src/__tests__/integration/provider.test.tsx`)

Test:
- Provider initializes SDK client correctly
- Provider syncs wallet state to Zustand store
- Provider cleans up on unmount
- Multiple providers throw error
- Context available to children

#### 3.2 Hook Integration (`packages/react/src/__tests__/integration/hooks.test.tsx`)

Test:
- useWallet syncs with SDK wallet state
- useConnect triggers SDK connect
- useAuthenticate completes full auth flow
- useAccount fetches and caches data
- usePay completes payment flow
- Query invalidation works correctly
- Error states propagate to hooks

---

### 4. Error Scenario Tests

#### 4.1 Network Failures (`error-scenarios.test.ts`)

Test:
- Network timeout triggers retry
- 3 retries with exponential backoff
- Final failure throws NetworkError
- Request cancellation via AbortController

#### 4.2 Rate Limiting (`rate-limit.test.ts`)

Test:
- 429 response triggers RateLimitError
- Retry-After header parsed correctly
- Automatic retry after delay

#### 4.3 API Errors (`api-errors.test.ts`)

Test:
- 400 returns ValidationError with field details
- 401 returns auth error and clears session
- 403 returns permission error
- 404 returns not found error
- 500 returns server error

#### 4.4 Payment Errors (`payment-errors.test.ts`)

Test:
- Insufficient balance detected before signing
- Invalid signature rejected by verify
- Settlement failure returns error with reason
- Expired authorization rejected

---

### 5. Cross-Module Tests

#### 5.1 Event Propagation (`events.test.ts`)

Test:
- Wallet connect emits event to EventBus
- Auth state change triggers HTTP client token update
- Realtime events propagate to subscribers

#### 5.2 State Synchronization (`state-sync.test.ts`)

Test:
- Wallet disconnect clears auth state
- Auth logout clears stored token
- Client destroy cleans up all subscriptions

---

### 6. Test Configuration

#### 6.1 Vitest Config for Integration Tests

```typescript
// packages/sdk/vitest.integration.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/integration/**/*.test.ts'],
    setupFiles: ['./src/__tests__/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

#### 6.2 Package.json Scripts

Add to `packages/sdk/package.json`:
```json
{
  "scripts": {
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:integration:watch": "vitest --config vitest.integration.config.ts"
  }
}
```

---

## Verification Checklist

- [ ] MSW handlers created for all endpoints
- [ ] All full flow tests pass
- [ ] All error scenario tests pass
- [ ] React integration tests pass
- [ ] Cross-module tests pass
- [ ] No flaky tests (run 3x to verify)
- [ ] Tests complete in reasonable time (<60s total)

## Completion Criteria

This task is complete when:
1. All integration tests pass consistently
2. Tests cover complete user journeys
3. Error scenarios are comprehensively tested
4. No test flakiness
5. Tests are well-organized and documented

## Notes for AI Agent

- Use MSW for API mocking (not manual fetch mocks)
- Create deterministic test data
- Each test should be independent (no shared state)
- Clean up after each test
- Wait for approval before proceeding to Task 6
