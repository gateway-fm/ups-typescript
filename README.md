# UPS x402 SDK

[![CI](https://github.com/gateway-fm/ups-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/gateway-fm/ups-typescript/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@gatewayfm%2Fsdk.svg)](https://www.npmjs.com/package/@gatewayfm/ups-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for the [x402 Universal Payments Protocol](https://x402.org) — enabling seamless blockchain payments with Smart Accounts.

## Features

- 🔐 **Smart Account Management** — Create and manage EIP-4337 compatible accounts
- 💸 **x402 Payments** — EIP-3009 transfer authorizations with typed signatures
- ⚛️ **React Hooks** — First-class React integration with TanStack Query
- 🔄 **Multi-Chain** — TAU, Base, Base Sepolia, and Ethereum Mainnet support
- 📦 **Dual Build** — ESM and CommonJS compatible

## Installation

```bash
# Using pnpm (recommended)
pnpm add @gatewayfm/ups-sdk

# For React projects
pnpm add @gatewayfm/ups-sdk @gatewayfm/ups-react
```

## Quick Start

### Node.js / Vanilla TypeScript

```typescript
import { UPSClient } from '@gatewayfm/ups-sdk';

const client = new UPSClient({
    baseUrl: 'https://api.ups.example.com',
    network: 'eip155:737998412', // TAU Testnet
});

// Connect wallet (EIP-1193 provider)
await client.connect(window.ethereum);

// Authenticate with the UPS backend
await client.authenticate();

// Create a Smart Account
const { account, txHash } = await client.account.create({
    ownerAddress: client.wallet.getAddress()!,
    salt: '0x' + crypto.randomUUID().replace(/-/g, '').padEnd(64, '0'),
});

console.log('Account created:', account.walletAddress);
```

### React

```tsx
import { UPSProvider, useWallet, useAccount, usePayment } from '@gatewayfm/ups-react';

function App() {
    return (
        <UPSProvider config={{ baseUrl: '...', network: 'eip155:737998412' }}>
            <PaymentFlow />
        </UPSProvider>
    );
}

function PaymentFlow() {
    const { connect, isConnected, address } = useWallet();
    const { createAccount } = useAccount();
    const { pay, isPaying } = usePayment();

    return (
        <div>
            {!isConnected ? (
                <button onClick={() => connect(window.ethereum)}>
                    Connect Wallet
                </button>
            ) : (
                <p>Connected: {address}</p>
            )}
        </div>
    );
}
```

## Packages

| Package | Description | Docs |
| :--- | :--- | :--- |
| [`@gatewayfm/ups-sdk`](./packages/sdk) | Core SDK — wallet, account, and payment modules | [README](./packages/sdk/README.md) |
| [`@gatewayfm/ups-react`](./packages/react) | React hooks and context provider | [README](./packages/react/README.md) |
| [`@gatewayfm/test-utils`](./packages/test-utils) | Testing utilities and mocks | — |

## Examples

See the [`examples/`](./examples) directory:

- **[Basic Node.js](./examples/basic)** — Standalone TypeScript example
- **[React + Vite](./examples/react-app)** — Full React application

```bash
# Run the basic example
cd examples/basic
pnpm install
pnpm start
```

## Documentation

### SDK Modules

**`client.wallet`** — Wallet connection and signing
```typescript
await client.connect(provider);          // Connect EIP-1193 wallet
await client.wallet.signMessage(msg);    // Sign personal message
await client.wallet.signTypedData(data); // Sign EIP-712 typed data
client.wallet.getAddress();              // Get connected address
```

**`client.account`** — Smart Account management
```typescript
await client.account.list();             // List user's accounts
await client.account.create(params);     // Create new account
await client.account.predictAddress(p);  // Predict future address
```

**`client.payment`** — x402 payment flow
```typescript
await client.payment.pay({ requirements, from });  // Full payment flow
await client.payment.verify(signed, requirements); // Verify before settling
await client.payment.settle(signed, requirements); // Settle on-chain
```

### React Hooks

| Hook | Purpose |
| :--- | :--- |
| `useWallet()` | Wallet connection, address, chain ID |
| `useAuth()` | Authentication state and actions |
| `useAccount()` | Account CRUD with query caching |
| `usePayment()` | Payment execution with loading states |
| `useUPSClient()` | Direct SDK client access |

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Setup

```bash
git clone https://github.com/gateway-fm/ups-typescript.git
cd ups-typescript
pnpm install
pnpm build
```

### Commands

| Command | Description |
| :--- | :--- |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm dev` | Watch mode |

## Configuration

Create a `.env` file:

```bash
API_BASE_URL=https://api.ups.example.com
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_CHAIN_ID=84532
```

See [`SECRETS.md`](./SECRETS.md) for handling sensitive keys.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT © Gateway.fm

---

Built with ❤️ for the x402 ecosystem

