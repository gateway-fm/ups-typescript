import { UPSClient } from '@gateway-fm/ups-sdk';
import { createWalletClient, http, hexToBytes, bytesToHex, createPublicClient, defineChain } from 'viem';
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
    network: process.env.NETWORK_ID || 'eip155:737998412',
};

async function createAccount(role: string): Promise<{ client: UPSClient, account: any }> {
    console.log(`\n=== Creating ${role} Account ===`);

    const client = new UPSClient(config);
    const pk = generatePrivateKey();
    const walletAccount = privateKeyToAccount(pk);
    const provider = createMockProvider(walletAccount);

    console.log(`${role} Wallet:`, walletAccount.address);

    await client.connect(provider as any);
    await client.authenticate();

    const salt = generateSalt();
    try {
        const result = await client.account.create({
            ownerAddress: client.wallet.getAddress()!,
            salt: bytesToHex(salt),
        });

        console.log(`${role} Smart Account:`, result.account.walletAddress);
        return { client, account: result.account };
    } catch (error) {
        console.error(`Failed to create ${role} account:`, error);
        throw error;
    }
}

async function fundWallet(address: string) {
    console.log(`\n=== Funding ${address} ===`);
    const adminKey = process.env.BLOCKCHAIN_PRIVATE_KEY as `0x${string}`;
    if (!adminKey) {
        throw new Error('BLOCKCHAIN_PRIVATE_KEY not set in .env');
    }

    const chain = defineChain({
        id: 737998412,
        name: 'Tau Testnet',
        network: 'tau',
        nativeCurrency: { decimals: 18, name: 'Tau', symbol: 'TAU' },
        rpcUrls: { default: { http: [process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.tau.gateway.fm'] } }
    });

    const adminAccount = privateKeyToAccount(adminKey);
    const walletClient = createWalletClient({
        account: adminAccount,
        chain,
        transport: http()
    });
    const publicClient = createPublicClient({ chain, transport: http() });

    const tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`;
    if (!tokenAddress) throw new Error('TOKEN_ADDRESS not set in .env');

    // ERC20 Transfer: transfer(address,uint256) -> 0xa9059cbb
    const amount = 100000000n; // 100 tokens (assumes 6 decimals)
    const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedAmount = amount.toString(16).padStart(64, '0');
    const data = `0xa9059cbb${paddedAddress}${paddedAmount}` as `0x${string}`;

    try {
        const hash = await walletClient.sendTransaction({
            to: tokenAddress,
            data,
        });
        console.log('Funding TX Hash:', hash);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log('Funding confirmed');
    } catch (error) {
        console.error('Funding failed:', error);
        // Don't throw, maybe it has funds?
    }
}

async function demonstratePayment(buyerSA: string, merchantSA: string, client: UPSClient) {
    console.log('\n=== Payment Flow ===');

    const requirements = {
        scheme: 'exact',
        network: config.network,
        maxAmountRequired: '1000000', // 1 token
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

        console.log('Payment Result Object:', JSON.stringify(result, null, 2));
        console.log('Payment success:', result.success);
        console.log('Payment TX Hash:', result.transaction);
    } catch (error) {
        console.error('Payment failed:', error);
        throw error;
    }
}

async function getBalance(address: string, publicClient: any) {
    const tokenAddress = process.env.TOKEN_ADDRESS as `0x${string}`;
    const data = `0x70a08231${address.toLowerCase().replace('0x', '').padStart(64, '0')}` as `0x${string}`;
    const balance = await publicClient.call({ to: tokenAddress, data });
    return BigInt(balance.data || '0');
}

async function main() {
    try {
        // 1. Create Buyer
        const { client: buyerClient, account: buyerAccount } = await createAccount('Buyer');

        // 2. Create Merchant
        const { account: merchantAccount } = await createAccount('Merchant');

        // 3. Fund Buyer
        await fundWallet(buyerAccount.walletAddress);

        // Check Balance
        const chain = defineChain({
            id: 737998412,
            name: 'Tau Testnet',
            network: 'tau',
            nativeCurrency: { decimals: 18, name: 'Tau', symbol: 'TAU' },
            rpcUrls: { default: { http: [process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.tau.gateway.fm'] } }
        });
        const publicClient = createPublicClient({ chain, transport: http() });
        const balance = await getBalance(buyerAccount.walletAddress, publicClient);
        console.log(`Buyer Balance: ${balance.toString()}`);

        // 4. Pay
        await demonstratePayment(buyerAccount.walletAddress, merchantAccount.walletAddress, buyerClient);

    } catch (error) {
        console.error('Example failed:', error);
        process.exit(1);
    }
}

main();
