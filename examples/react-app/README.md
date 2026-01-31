# UPS SDK React Example

This example demonstrates how to use the UPS SDK in a React application using the `@x402-ups/react` hooks library.

## Features

- **Wallet Connection**: Connect with MetaMask (via `viem`).
- **Account Creation**: Create a new Smart Account using `useCreateAccount`.
- **Account Management**: List and view Smart Accounts using `useAccounts`.
- **Payments**: Execute payments using `usePayment`.

## Prerequisites

- Node.js >= 18
- pnpm
- MetaMask installed in browser

## Setup

1. Install dependencies (from root):
   \`\`\`bash
   pnpm install
   \`\`\`

2. Configure environment:
   Copy \`.env.example\` to \`.env\` and update if needed.
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Defaults:
   - \`VITE_API_BASE_URL\`: http://localhost:8080
   - \`VITE_NETWORK_ID\`: eip155:84532 (Base Sepolia)

## Running the Example

\`\`\`bash
pnpm dev
\`\`\`

Open http://localhost:5173 to view the app.

## Usage Guide

1. Click **Connect MetaMask**.
2. If not authenticated, click **Authenticate & Create** or just **Authenticate** (handled by hooks).
3. Click **Create Smart Account** to deploy a new account.
4. Use the **Payment** form to send tokens (requires funding the Smart Account first).
