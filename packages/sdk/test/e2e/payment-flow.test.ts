import { describe, it, expect, afterAll } from 'vitest';
import { UPSClient } from '../../src';
import { PaymentRequirements } from '../../src/types';
import { config } from './setup';
import { createTestWallet, createProviderFromPrivateKey, fundTokens, getTokenBalance, waitForTx, randomSalt } from './helpers';

describe('B2C Payment Flow', () => {
    let buyerClient: UPSClient;
    let merchantClient: UPSClient;

    afterAll(() => {
        // Cleanup if necessary
    });

    it('should complete payment from buyer to merchant', async () => {
        // === Setup ===

        // 1. Create buyer client and wallet
        const buyerWallet = createTestWallet();
        const buyerProvider = createProviderFromPrivateKey(buyerWallet.privateKey);
        buyerClient = new UPSClient({ baseUrl: config.apiBaseUrl, network: config.network as any });

        // 2. Create merchant client and wallet
        const merchantWallet = createTestWallet();
        const merchantProvider = createProviderFromPrivateKey(merchantWallet.privateKey);
        merchantClient = new UPSClient({ baseUrl: config.apiBaseUrl, network: config.network as any });

        // 3. Connect and authenticate both
        await buyerClient.connect(buyerProvider);
        await buyerClient.authenticate();

        await merchantClient.connect(merchantProvider);
        await merchantClient.authenticate();

        // 4. Create SmartAccounts for both
        // Buyer SA
        const buyerSalt = randomSalt();
        const buyerAccount = await buyerClient.account.create({
            ownerAddress: buyerWallet.address,
            salt: buyerSalt,
        });
        const buyerSA = buyerAccount.account.walletAddress;

        // Merchant SA
        const merchantSalt = randomSalt();
        const merchantAccount = await merchantClient.account.create({
            ownerAddress: merchantWallet.address,
            salt: merchantSalt,
        });
        const merchantSA = merchantAccount.account.walletAddress;

        console.log('Buyer SA:', buyerSA);
        console.log('Merchant SA:', merchantSA);

        // 5. Fund buyer SA with tokens (100 tokens, 6 decimals)
        const decimals = 6n;
        const fundAmount = 100n * 10n ** decimals;
        await fundTokens(buyerSA, fundAmount);

        // Verify initial balance
        const initialBuyerBalance = await getTokenBalance(buyerSA);
        console.log('Initial Buyer Balance:', initialBuyerBalance);
        expect(initialBuyerBalance).toBeGreaterThanOrEqual(fundAmount);

        const initialMerchantBalance = await getTokenBalance(merchantSA);

        // === Execute Payment ===

        // 6. Build payment requirements
        const paymentAmount = 10n * 10n ** decimals; // 10 tokens
        const requirements: PaymentRequirements = {
            scheme: 'exact',
            network: config.network,
            maxAmountRequired: paymentAmount.toString(),
            asset: config.paymentTokenAddress,
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

        console.log('Payment TX Hash:', result.txHash);

        // 9. Wait for confirmation
        if (result.txHash) {
            await waitForTx(result.txHash);
        }

        // 10. Verify final balances
        const finalBuyerBalance = await getTokenBalance(buyerSA);
        const finalMerchantBalance = await getTokenBalance(merchantSA);

        console.log('Final Buyer Balance:', finalBuyerBalance);
        console.log('Final Merchant Balance:', finalMerchantBalance);

        // Check balances
        // Buyer should have decreased by at least payment amount (could be more if gas used? No, facilitator pays gas usually, but this is token transfer)
        // The test in python strictly checks amounts.
        expect(finalBuyerBalance).toBeLessThanOrEqual(initialBuyerBalance - paymentAmount);
        expect(finalMerchantBalance).toBeGreaterThanOrEqual(initialMerchantBalance + paymentAmount);
    });
});
