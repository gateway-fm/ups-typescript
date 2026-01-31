# Basic UPS SDK Example

This example demonstrates how to use the UPS SDK in a plain Node.js environment to simulate a complete payment flow between two parties.

## Prerequisites

- Node.js >= 18
- pnpm

## Setup

1. Install dependencies (from root):
   ```bash
   pnpm install
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and update values.
   ```bash
   cp .env.example .env
   ```
   
   **Required Configuration:**
   - `UPS_API_URL`: URL of the UPS API (must include `/api/v1` suffix, e.g., `http://localhost:8080/api/v1`)
   - `NETWORK_ID`: Chain ID of the network (must match the running chain, e.g., `eip155:737998412` for Tau Testnet)
   - `BLOCKCHAIN_PRIVATE_KEY`: **Admin private key** (0x-prefixed) used to fund the buyer's account with tokens.
   - `TOKEN_ADDRESS`: Address of the ERC-20 payment token.

## Running the Example

```bash
pnpm start
```

This will automatically:
1.  **Initialize** the SDK.
2.  **Create a Buyer** Smart Account (simulating a user).
3.  **Create a Merchant** Smart Account.
4.  **Fund the Buyer** with tokens (using the Admin key).
5.  **Execute a Payment** from the Buyer to the Merchant using the `x402` protocol.

## Expected Output

```
=== Creating Buyer Account ===
Buyer Wallet: 0x...
Buyer Smart Account: 0x...

=== Creating Merchant Account ===
Merchant Wallet: 0x...
Merchant Smart Account: 0x...

=== Funding Buyer ===
Funding TX Hash: 0x...
Funding confirmed
Buyer Balance: 100000000

=== Payment Flow ===
Payment Result Object: { ... }
Payment success: true
Payment TX Hash: 0x...
```

**Note:** Ensure your local backend services and blockchain node (or testnet connection) are running and accessible.
