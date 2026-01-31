# Basic UPS SDK Example

This example demonstrates how to use the UPS SDK in a plain Node.js environment.

## Prerequisites

- Node.js >= 18
- pnpm

## Setup

1. Install dependencies (from root):
   \`\`\`bash
   pnpm install
   \`\`\`

2. Configure environment:
   Copy \`.env.example\` to \`.env\` and update values if needed.
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Defaults:
   - \`UPS_API_URL\`: http://localhost:8080
   - \`NETWORK_ID\`: eip155:84532 (Base Sepolia)

## Running the Example

\`\`\`bash
pnpm start
\`\`\`

This will:
1. Initialize the SDK
2. Generate a random wallet (or use provided PRIVATE_KEY)
3. Connect and authenticate with the UPS API
4. Deploy a new Smart Account (if funds allow, otherwise simulates/fails gracefully or on testnet)

**Note:** Account creation requires the UPS API to be running locally or defined in \`UPS_API_URL\`.
