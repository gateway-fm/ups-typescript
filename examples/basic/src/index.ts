import { UPSClient } from '@x402-ups/sdk';
import { createWalletClient, http, hexToBytes, bytesToHex } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';
import { createMockProvider } from './mock-provider.js';

dotenv.config();

function generateSalt(): Uint8Array {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    return salt;
}

const config = {
    baseUrl: process.env.UPS_API_URL || 'http://localhost:8080',
    network: process.env.NETWORK_ID || 'eip155:84532',
};

async function demonstrateAccountCreation() {
    console.log('=== Account Creation Flow ===');

    // Initialize SDK
    const client = new UPSClient(config);

    // Create wallet (simulate external wallet)
    // Use provided private key or generate a random one
    const pk = process.env.PRIVATE_KEY as `0x${string}` || generatePrivateKey();
    const account = privateKeyToAccount(pk);
    const provider = createMockProvider(account);

    console.log('Using wallet address:', account.address);

    // Connect wallet
    await client.connect(provider as any);
    console.log('Connected to SDK');

    // Authenticate
    await client.authenticate();
    console.log('Authenticated:', client.auth.isAuthenticated());

    // Generate salt and create account
    const salt = generateSalt();
    try {
        const result = await client.account.create({
            ownerAddress: client.wallet.getAddress()!,
            salt: bytesToHex(salt),
        });

        console.log('Account created successfully!');
        console.log('Smart Account Address:', result.account.walletAddress);
        console.log('Creation TX Hash:', result.txHash);

        return result.account;
    } catch (error) {
        console.error('Failed to create account:', error);
        throw error;
    }
}

async function demonstratePayment(buyerSA: string, merchantSA: string, client: UPSClient) {
    console.log('\n=== Payment Flow ===');

    if (!process.env.TOKEN_ADDRESS) {
        console.log('Skipping payment flow: TOKEN_ADDRESS not set in .env');
        return;
    }

    const requirements = {
        scheme: 'exact',
        network: config.network,
        maxAmountRequired: '10000000', // 10 tokens (assuming 6 decimals) or appropriate unit
        asset: process.env.TOKEN_ADDRESS!,
        payTo: merchantSA,
        maxTimeoutSeconds: 3600,
        extra: { name: 'x402 Payment Token', version: '1' },
    };

    try {
        const result = await client.payment.pay({
            requirements,
            from: buyerSA,
        });

        console.log('Payment result:', result.success);
        console.log('TX Hash:', result.txHash);
    } catch (error) {
        console.error('Payment failed:', error);
    }
}

async function main() {
    try {
        const account = await demonstrateAccountCreation();

        // For a real payment flow, we need a merchant account and funding.
        // This is a placeholder for where that logic would go.
        // If we had a merchant address, we could uncomment:
        // const client = new UPSClient(config);
        // await demonstratePayment(account.walletAddress, '0xMerchantAddress...', client);

    } catch (error) {
        console.error('Example failed:', error);
        process.exit(1);
    }
}

main();
