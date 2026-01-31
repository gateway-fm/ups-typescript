# Task 3: React Integration (@x402-ups/react)

## Objective
Implement React hooks and context provider for easy integration with React applications.

## Prerequisites
- Task 1 completed and approved
- Task 2 completed and approved

---

## 3.1 Store (src/store.ts)

Create a Zustand store to hold SDK state that needs to be shared across components.

**State Shape:**
```typescript
interface UPSStore {
  // Client instance
  client: UPSClient | null;
  setClient: (client: UPSClient | null) => void;
  
  // Wallet state (synced from SDK)
  walletState: WalletState;
  setWalletState: (state: WalletState) => void;
  
  // Auth state (synced from SDK)
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  
  // Current user's account (after creation)
  currentAccount: Account | null;
  setCurrentAccount: (account: Account | null) => void;
}
```

**Implementation Notes:**
- Use `create` from `zustand`
- Initialize with default/empty states
- Simple setters for each piece of state

---

## 3.2 Provider (src/provider.tsx)

Create the context provider that initializes the SDK and syncs state.

**Component: UPSProvider**
```typescript
interface UPSProviderProps {
  config: UPSConfig;
  children: ReactNode;
}

function UPSProvider({ config, children }: UPSProviderProps)
```

**Responsibilities:**
- Create `UPSClient` instance from config (memoized)
- Store client in Zustand store
- Subscribe to `wallet.onStateChange` → update store
- Subscribe to `auth.onStateChange` → update store
- Cleanup on unmount: unsubscribe + destroy client

**Hooks to export:**
```typescript
function useUPSContext(): { client: UPSClient; isInitialized: boolean }
function useUPSClient(): UPSClient  // throws if not in provider
```

---

## 3.3 Wallet Hooks (src/hooks/use-wallet.ts)

### useWallet
Main hook for wallet state and actions.

```typescript
interface UseWalletReturn {
  // State
  state: WalletState;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  
  // Actions (TanStack Query mutations)
  connect: UseMutationResult<ConnectedWallet, Error, EIP1193Provider>;
  disconnect: UseMutationResult<void, Error, void>;
  
  // Direct methods
  signMessage: (message: string) => Promise<string>;
  switchChain: (chainId: number) => Promise<void>;
}
```

### useConnect
Simplified connect hook for common MetaMask case.

```typescript
interface UseConnectReturn {
  connect: (provider?: EIP1193Provider) => Promise<ConnectedWallet>;
  isPending: boolean;
  error: Error | null;
}
```

**Implementation Notes:**
- Default to `window.ethereum` if no provider passed
- Throw descriptive error if no wallet found

### useDisconnect
```typescript
interface UseDisconnectReturn {
  disconnect: () => Promise<void>;
  isPending: boolean;
}
```

---

## 3.4 Auth Hooks (src/hooks/use-auth.ts)

### useAuth
```typescript
interface UseAuthReturn {
  // State
  state: AuthState;
  isAuthenticated: boolean;
  
  // Actions
  authenticate: UseMutationResult<void, Error, void>;
  logout: () => void;
}
```

**Implementation Notes:**
- `authenticate` mutation calls `client.authenticate()`
- Updates store auth state after mutation
- `logout` is synchronous, calls `client.auth.logout()`

---

## 3.5 Account Hooks (src/hooks/use-account.ts)

### Query Keys
```typescript
const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
  byWallet: (address: string) => [...accountKeys.all, 'wallet', address] as const,
};
```

### useAccounts
List all user accounts.
```typescript
function useAccounts(): UseQueryResult<Account[], Error>
```

### useAccount
Get account by ID.
```typescript
function useAccount(id: string): UseQueryResult<Account, Error>
```

### useAccountByWallet
Get account by wallet address.
```typescript
function useAccountByWallet(address: string | null): UseQueryResult<Account, Error>
// enabled: !!address
```

### usePredictAddress
```typescript
interface UsePredictAddressReturn {
  predictAddress: (owner: string, salt: string) => Promise<string>;
  isPending: boolean;
  error: Error | null;
}
```

### useCreateAccount
```typescript
interface UseCreateAccountReturn {
  createAccount: (params: CreateAccountParams) => Promise<CreateAccountResponse>;
  isPending: boolean;
  error: Error | null;
  data: CreateAccountResponse | undefined;
}
```

**Implementation Notes:**
- On success: update `currentAccount` in store
- Invalidate `accountKeys.list()` query

### useCurrentAccount
```typescript
function useCurrentAccount(): Account | null
// Returns from Zustand store
```

### Utility: generateSalt
```typescript
function generateSalt(): string
// Returns 0x-prefixed 32-byte random hex string
```

---

## 3.6 Payment Hooks (src/hooks/use-payment.ts)

### usePayment
Main hook for executing payments.

```typescript
interface UsePaymentParams {
  requirements: PaymentRequirements;
  from: string;  // Payer SmartAccount address
}

interface UsePaymentReturn {
  pay: (params: UsePaymentParams) => Promise<PaymentResult>;
  isPending: boolean;
  error: Error | null;
  data: PaymentResult | undefined;
  reset: () => void;
}
```

**Implementation Notes:**
- Wraps `client.payment.pay()`
- Returns mutation result

### usePaymentVerify
For manual verify step (if needed).
```typescript
interface UsePaymentVerifyReturn {
  verify: (signed: SignedAuthorization, requirements: PaymentRequirements) => Promise<VerifyResponse>;
  isPending: boolean;
  error: Error | null;
}
```

### usePaymentSettle
For manual settle step (if needed).
```typescript
interface UsePaymentSettleReturn {
  settle: (signed: SignedAuthorization, requirements: PaymentRequirements) => Promise<SettleResponse>;
  isPending: boolean;
  error: Error | null;
}
```

---

## 3.7 Package Exports (src/index.ts)

Export all public APIs:
```typescript
// Provider
export { UPSProvider, useUPSContext, useUPSClient } from './provider';

// Store
export { useUPSStore } from './store';

// Hooks
export { useWallet, useConnect, useDisconnect } from './hooks/use-wallet';
export { useAuth } from './hooks/use-auth';
export {
  useAccounts,
  useAccount,
  useAccountByWallet,
  usePredictAddress,
  useCreateAccount,
  useCurrentAccount,
  generateSalt,
} from './hooks/use-account';
export { usePayment, usePaymentVerify, usePaymentSettle } from './hooks/use-payment';

// Re-export types from SDK for convenience
export type { UPSConfig, Account, PaymentRequirements, PaymentResult } from '@x402-ups/sdk';
```

---

## 3.8 Package Configuration

Update `packages/react/tsup.config.ts`:
- External: react, @tanstack/react-query, @x402-ups/sdk
- JSX transform: react-jsx

---

## Acceptance Criteria

- [ ] `pnpm build` completes without errors
- [ ] `pnpm typecheck` passes
- [ ] UPSProvider initializes SDK and provides context
- [ ] useWallet returns correct state and actions
- [ ] useAuth handles authentication flow
- [ ] useCreateAccount creates account and updates store
- [ ] usePayment executes full payment flow
- [ ] All hooks are properly typed
- [ ] No React warnings about hook rules

## Usage Example (for verification)
```tsx
<QueryClientProvider client={queryClient}>
  <UPSProvider config={{ baseUrl: 'http://localhost:8080', network: 'eip155:84532' }}>
    <App />
  </UPSProvider>
</QueryClientProvider>

// In component:
const { connect, isConnected } = useWallet();
const { authenticate, isAuthenticated } = useAuth();
const { createAccount, isPending } = useCreateAccount();
const { pay } = usePayment();
```
