# Task 6: Examples

## Objective
Create example applications demonstrating the SDK usage for account creation and B2C payment flows.

## Prerequisites
- Task 2 completed and approved
- Task 3 completed and approved

---

## 6.1 Basic Example (Vanilla TypeScript)

### Location: examples/basic/

A minimal Node.js/browser script demonstrating SDK usage without React.

**Structure:**
```
examples/basic/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Main example script
│   └── mock-provider.ts   # Mock EIP-1193 provider for testing
└── README.md
```

**package.json:**
```json
{
  "name": "@x402-ups/example-basic",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@x402-ups/sdk": "workspace:*",
    "viem": "^2.21.0"
  },
  "devDependencies": {
    "tsx": "^4.15.0",
    "typescript": "^5.5.0"
  }
}
```

**src/index.ts - Key Sections:**

1. **Configuration**
```typescript
import { UPSClient } from '@x402-ups/sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  network: 'eip155:84532',
};
```

2. **Account Creation Flow**
```typescript
async function demonstrateAccountCreation() {
  console.log('=== Account Creation Flow ===');
  
  // Initialize SDK
  const client = new UPSClient(config);
  
  // Create wallet (in real app, this comes from MetaMask)
  const account = privateKeyToAccount('0x...');
  const provider = createMockProvider(account);
  
  // Connect wallet
  await client.connect(provider);
  console.log('Connected:', client.wallet.getAddress());
  
  // Authenticate
  await client.authenticate();
  console.log('Authenticated:', client.auth.isAuthenticated());
  
  // Generate salt and create account
  const salt = generateSalt();
  const result = await client.account.create({
    ownerAddress: client.wallet.getAddress()!,
    salt,
  });
  
  console.log('Account created:', result.account.walletAddress);
  console.log('TX Hash:', result.txHash);
  
  return result.account;
}
```

3. **Payment Flow**
```typescript
async function demonstratePayment(buyerSA: string, merchantSA: string) {
  console.log('=== Payment Flow ===');
  
  const requirements = {
    scheme: 'exact',
    network: 'eip155:84532',
    maxAmountRequired: '10000000', // 10 tokens
    asset: process.env.TOKEN_ADDRESS!,
    payTo: merchantSA,
    maxTimeoutSeconds: 3600,
    extra: { name: 'x402 Payment Token', version: '1' },
  };
  
  const result = await client.payment.pay({
    requirements,
    from: buyerSA,
  });
  
  console.log('Payment result:', result.success);
  console.log('TX Hash:', result.txHash);
}
```

4. **Main**
```typescript
async function main() {
  try {
    const account = await demonstrateAccountCreation();
    // For payment demo, you'd need a merchant account too
    // await demonstratePayment(account.walletAddress, merchantSA);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

**README.md:**
- Setup instructions
- Required environment variables
- How to run the example
- Expected output

---

## 6.2 React Example

### Location: examples/react-app/

A React application demonstrating the React hooks integration.

**Structure:**
```
examples/react-app/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── AccountCreation.tsx
│   │   ├── AccountInfo.tsx
│   │   └── PaymentForm.tsx
│   └── styles.css
└── README.md
```

**package.json:**
```json
{
  "name": "@x402-ups/example-react",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@x402-ups/sdk": "workspace:*",
    "@x402-ups/react": "workspace:*",
    "@tanstack/react-query": "^5.50.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
```

**src/main.tsx:**
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UPSProvider } from '@x402-ups/react';
import { App } from './App';

const queryClient = new QueryClient();
const config = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  network: 'eip155:84532',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <UPSProvider config={config}>
      <App />
    </UPSProvider>
  </QueryClientProvider>
);
```

**src/components/WalletConnect.tsx:**
```tsx
// Demonstrates:
// - useWallet hook
// - useConnect hook
// - useDisconnect hook
// - Connection status display
// - Connect/Disconnect buttons
```

**src/components/AccountCreation.tsx:**
```tsx
// Demonstrates:
// - useAuth hook
// - useCreateAccount hook
// - usePredictAddress hook
// - generateSalt utility
// - Form for account creation
// - Display of created account info and txHash
```

**src/components/AccountInfo.tsx:**
```tsx
// Demonstrates:
// - useAccounts hook
// - useCurrentAccount hook
// - Display of account list
// - Account details
```

**src/components/PaymentForm.tsx:**
```tsx
// Demonstrates:
// - usePayment hook
// - Form for payment details (amount, recipient)
// - Payment execution
// - Success/error display
```

**src/App.tsx:**
```tsx
// Main app layout:
// 1. Header with wallet connection status
// 2. Conditional rendering based on auth state:
//    - Not connected: Show WalletConnect
//    - Connected, not authenticated: Show authenticate button
//    - Authenticated: Show AccountCreation, AccountInfo, PaymentForm
```

**README.md:**
- Setup instructions
- How to run development server
- How to connect MetaMask
- Walkthrough of the demo flows

---

## 6.3 Example Documentation

### examples/README.md

Main README covering:
1. Overview of examples
2. Prerequisites (Node.js, pnpm, MetaMask)
3. Required environment variables
4. Quick start for each example
5. Links to SDK documentation

---

## Acceptance Criteria

- [ ] Basic example runs with `pnpm start`
- [ ] React example runs with `pnpm dev`
- [ ] Examples demonstrate account creation flow
- [ ] Examples demonstrate payment flow (or document prerequisites)
- [ ] README files are clear and complete
- [ ] No hardcoded secrets in example code
- [ ] Examples use workspace dependencies correctly

## Verification Commands
```bash
# Basic example
cd examples/basic
pnpm install
pnpm start

# React example
cd examples/react-app
pnpm install
pnpm dev
# Open http://localhost:5173
```

## Notes
- Examples should use environment variables for configuration
- Payment example requires funded SmartAccounts
- React example should work with MetaMask in browser
- Consider adding comments explaining each step
