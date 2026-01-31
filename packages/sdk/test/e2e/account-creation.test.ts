import { describe, it, expect, afterAll } from 'vitest';
import { UPSClient } from '../../src';
import { config } from './setup';
import { createTestWallet, createProviderFromPrivateKey, randomSalt } from './helpers';

describe('Account Creation Flow', () => {
    let client: UPSClient;

    afterAll(() => {
        if (client) {
            // client.destroy(); // Add if destroy method exists, otherwise ignore
        }
    });

    it('should create account with SmartAccount deployment', async () => {
        // 1. Create SDK client
        client = new UPSClient({
            baseUrl: config.apiBaseUrl,
            network: config.network as any // Cast if type mismatch
        });

        // 2. Create test wallet
        const testWallet = createTestWallet();
        const provider = createProviderFromPrivateKey(testWallet.privateKey);

        // 3. Connect wallet
        await client.connect(provider);
        expect(client.wallet.isConnected()).toBe(true);
        // expect(client.wallet.getAddress()).toBe(testWallet.address); // Case sensitivity might ensure
        expect(client.wallet.getAddress()?.toLowerCase()).toBe(testWallet.address.toLowerCase());

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

        console.log('Created Account:', result.account.walletAddress);

        // 7. List accounts and verify
        const accounts = await client.account.list();
        const found = accounts.find(a => a.id === result.account.id);
        expect(found).toBeDefined();
    });

    it('should predict SmartAccount address correctly', async () => {
        // Setup new wallet for clean state or reuse
        const testWallet = createTestWallet();
        const provider = createProviderFromPrivateKey(testWallet.privateKey);
        const localClient = new UPSClient({ baseUrl: config.apiBaseUrl, network: config.network as any });

        await localClient.connect(provider);
        await localClient.authenticate();

        const salt = randomSalt();
        const predictedAddress = await localClient.account.predictAddress({
            ownerAddress: testWallet.address,
            salt,
        });

        expect(predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

        // Create account and verify
        const result = await localClient.account.create({
            ownerAddress: testWallet.address,
            salt,
        });

        expect(result.account.walletAddress.toLowerCase()).toBe(predictedAddress.toLowerCase());
    });
});
