# Task 5: Full Flow E2E Tests

## Objective
Create end-to-end tests that verify the SDK works correctly against a live backend, testing the complete account creation and B2C payment flows.

## Prerequisites
- Task 2 completed and approved
- Backend API running and accessible
- Test blockchain (Base Sepolia) accessible

---

## 5.1 Test Environment Setup

### Create test/e2e/setup.ts
```typescript
// Environment variables required:
// - API_BASE_URL: Backend API URL (e.g., http://localhost:8080)
// - BLOCKCHAIN_RPC_URL: RPC URL (e.g., https://sepolia.base.org)
// - BLOCKCHAIN_CHAIN_ID: Chain ID (e.g., 84532)
// - BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS: Token contract address
// - TEST_PRIVATE_KEY: Private key for test wallet (funded with tokens)
// - ADMIN_PRIVATE_KEY: Admin key for funding test accounts (optional)

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.base.org',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '84532'),
  tokenAddress: process.env.BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS,
  network: `eip155:${process.env.BLOCKCHAIN_CHAIN_ID || '84532'}`,
};
```

### Create test/e2e/helpers.ts

**Helper Functions:**

```typescript
// Create a test wallet (viem)
function createTestWallet(): { address: string; privateKey: string; ... }

// Create mock EIP-1193 provider from private key
function createProviderFromPrivateKey(privateKey: string): EIP1193Provider

// Fund a SmartAccount with tokens (uses admin key)
async function fundTokens(toAddress: string, amount: bigint): Promise<void>

// Get token balance
async function getTokenBalance(address: string): Promise<bigint>

// Wait for transaction confirmation
async function waitForTx(txHash: string): Promise<void>

// Generate random salt
function randomSalt(): string
```

---

## 5.2 Account Creation Flow Tests

### test/e2e/account-creation.test.ts

Reference the Python E2E test flow:
```python
# From your Python tests:
# 1. Generate wallet
# 2. Authenticate
# 3. Create account with salt
# 4. Verify tx_hash returned
# 5. List accounts and verify created account exists
```

**Test Cases:**

#### Test 1: Full Account Creation Flow
```typescript
describe('Account Creation Flow', () => {
  it('should create account with SmartAccount deployment', async () => {
    // 1. Create SDK client
    const client = new UPSClient({ 
      baseUrl: config.apiBaseUrl, 
      network: config.network 
    });
    
    // 2. Create test wallet
    const testWallet = createTestWallet();
    const provider = createProviderFromPrivateKey(testWallet.privateKey);
    
    // 3. Connect wallet
    await client.connect(provider);
    expect(client.wallet.isConnected()).toBe(true);
    expect(client.wallet.getAddress()).toBe(testWallet.address);
    
    // 4. Authenticate
    await client.authenticate();
    expect(client.auth.isAuthenticated()).toBe(true);
    
    // 5. Generate salt and create account
    const salt = randomSalt();
    const result = await client.account.create({
      ownerAddress: testWallet.address,
      salt,
    });
    
    // 6. Verify response
    expect(result.txHash).toBeDefined();
    expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(result.account).toBeDefined();
    expect(result.account.ownerAddress.toLowerCase()).toBe(testWallet.address.toLowerCase());
    expect(result.account.walletAddress).toBeDefined();
    
    // 7. List accounts and verify
    const accounts = await client.account.list();
    const found = accounts.find(a => a.id === result.account.id);
    expect(found).toBeDefined();
    
    // Cleanup
    client.destroy();
  });
});
```

#### Test 2: Predict Address
```typescript
it('should predict SmartAccount address correctly', async () => {
  // Setup client and authenticate...
  
  const salt = randomSalt();
  const predictedAddress = await client.account.predictAddress({
    ownerAddress: walletAddress,
    salt,
  });
  
  expect(predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  
  // Optionally: Create account with same salt and verify addresses match
  const result = await client.account.create({ ownerAddress, salt });
  expect(result.account.walletAddress.toLowerCase()).toBe(predictedAddress.toLowerCase());
});
```

#### Test 3: List Accounts
```typescript
it('should list all user accounts', async () => {
  // Setup and create account...
  
  const accounts = await client.account.list();
  expect(Array.isArray(accounts)).toBe(true);
  // Should contain at least the account we just created
});
```

---

## 5.3 B2C Payment Flow Tests

### test/e2e/payment-flow.test.ts

Reference the Python E2E test flow:
```python
# From your Python tests:
# 1. Create buyer and merchant identities
# 2. Deploy SmartAccounts for both
# 3. Fund buyer SA with tokens
# 4. Build payment requirements
# 5. Sign EIP-712 authorization
# 6. POST /x402/verify
# 7. POST /x402/settle
# 8. Verify final balances
```

**Test Case: Full B2C Payment Flow**
```typescript
describe('B2C Payment Flow', () => {
  it('should complete payment from buyer to merchant', async () => {
    // === Setup ===
    
    // 1. Create buyer client and wallet
    const buyerWallet = createTestWallet();
    const buyerProvider = createProviderFromPrivateKey(buyerWallet.privateKey);
    const buyerClient = new UPSClient({ baseUrl, network });
    
    // 2. Create merchant client and wallet
    const merchantWallet = createTestWallet();
    const merchantProvider = createProviderFromPrivateKey(merchantWallet.privateKey);
    const merchantClient = new UPSClient({ baseUrl, network });
    
    // 3. Connect and authenticate both
    await buyerClient.connect(buyerProvider);
    await buyerClient.authenticate();
    
    await merchantClient.connect(merchantProvider);
    await merchantClient.authenticate();
    
    // 4. Create SmartAccounts for both
    const buyerAccount = await buyerClient.account.create({
      ownerAddress: buyerWallet.address,
      salt: randomSalt(),
    });
    const buyerSA = buyerAccount.account.walletAddress;
    
    const merchantAccount = await merchantClient.account.create({
      ownerAddress: merchantWallet.address,
      salt: randomSalt(),
    });
    const merchantSA = merchantAccount.account.walletAddress;
    
    // 5. Fund buyer SA with tokens (100 tokens)
    const fundAmount = 100n * 10n ** 6n; // 100 tokens (6 decimals)
    await fundTokens(buyerSA, fundAmount);
    
    // Verify initial balance
    const initialBuyerBalance = await getTokenBalance(buyerSA);
    expect(initialBuyerBalance).toBeGreaterThanOrEqual(fundAmount);
    
    // === Execute Payment ===
    
    // 6. Build payment requirements
    const paymentAmount = 10n * 10n ** 6n; // 10 tokens
    const requirements: PaymentRequirements = {
      scheme: 'exact',
      network: config.network,
      maxAmountRequired: paymentAmount.toString(),
      asset: config.tokenAddress,
      payTo: merchantSA,
      maxTimeoutSeconds: 3600,
      extra: { name: 'x402 Payment Token', version: '1' },
    };
    
    // 7. Execute payment (builds, signs, verifies, settles)
    const result = await buyerClient.payment.pay({
      requirements,
      from: buyerSA,
    });
    
    // 8. Verify result
    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
    expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    
    // 9. Wait for confirmation
    await waitForTx(result.txHash!);
    
    // 10. Verify final balances
    const finalBuyerBalance = await getTokenBalance(buyerSA);
    const finalMerchantBalance = await getTokenBalance(merchantSA);
    
    expect(finalBuyerBalance).toBeLessThanOrEqual(initialBuyerBalance - paymentAmount);
    expect(finalMerchantBalance).toBeGreaterThanOrEqual(paymentAmount);
    
    // Cleanup
    buyerClient.destroy();
    merchantClient.destroy();
  }, 60000); // 60 second timeout for blockchain operations
});
```

**Test Case: Payment Verification**
```typescript
it('should verify valid payment signature', async () => {
  // Setup buyer with SA...
  
  const authorization = buyerClient.payment.buildAuthorization(requirements, buyerSA);
  const signed = await buyerClient.payment.signAuthorization(authorization);
  
  const verifyResult = await buyerClient.payment.verify(signed, requirements);
  
  expect(verifyResult.isValid).toBe(true);
  expect(verifyResult.invalidReason).toBeUndefined();
});
```

**Test Case: Payment with Insufficient Balance**
```typescript
it('should fail payment with insufficient balance', async () => {
  // Create buyer SA without funding
  
  const requirements: PaymentRequirements = {
    // ... large amount
    maxAmountRequired: (1000n * 10n ** 6n).toString(),
  };
  
  // Should fail at verify or settle
  await expect(buyerClient.payment.pay({ requirements, from: buyerSA }))
    .rejects.toThrow();
});
```

---

## 5.4 Test Configuration

### Update vitest.config.ts
Add E2E test configuration:
```typescript
export default defineConfig({
  test: {
    // ... existing config
    include: ['packages/*/test/**/*.test.ts'],
    exclude: ['packages/*/test/e2e/**'],
  },
});

// Separate config for E2E
export const e2eConfig = defineConfig({
  test: {
    include: ['test/e2e/**/*.test.ts'],
    testTimeout: 120000, // 2 minutes for blockchain ops
    hookTimeout: 60000,
  },
});
```

### Add package.json script
```json
{
  "scripts": {
    "test:e2e": "vitest run --config vitest.e2e.config.ts"
  }
}
```

### Create .env.example
```
API_BASE_URL=http://localhost:8080
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_CHAIN_ID=84532
BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS=0x...
TEST_PRIVATE_KEY=0x...
ADMIN_PRIVATE_KEY=0x...
```

---

## Acceptance Criteria

- [ ] Account creation E2E test passes against live backend
- [ ] Payment flow E2E test passes with actual token transfers
- [ ] Tests handle blockchain confirmation times appropriately
- [ ] Tests clean up resources after completion
- [ ] Environment variables documented
- [ ] Tests can run independently (no shared state between tests)

## Verification Commands
```bash
# Set environment variables
export API_BASE_URL=http://localhost:8080
export BLOCKCHAIN_PAYMENT_TOKEN_ADDRESS=0x...
# ... etc

# Run E2E tests
pnpm test:e2e

# Run specific E2E test
pnpm test:e2e test/e2e/account-creation.test.ts
```

## Notes
- E2E tests require a running backend and blockchain access
- Tests may take longer due to blockchain confirmation times
- Consider using a test-specific funded wallet
- Clean up: sweep funds back to admin after tests if needed
