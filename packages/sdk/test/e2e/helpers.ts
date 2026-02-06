import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { defineChain } from 'viem';
import { config } from './setup';

// Define the chain based on config
const chain = defineChain({
    id: config.chainId,
    name: 'Tau Testnet',
    network: 'tau',
    nativeCurrency: {
        decimals: 18,
        name: 'Tau',
        symbol: 'TAU',
    },
    rpcUrls: {
        default: { http: [config.rpcUrl] },
        public: { http: [config.rpcUrl] },
    },
});

export const publicClient = createPublicClient({
    chain,
    transport: http(),
});

export const adminClient = config.privateKey
    ? createWalletClient({
        chain,
        transport: http(),
        account: privateKeyToAccount(config.privateKey),
    })
    : null;

export function createTestWallet() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
        address: account.address,
        privateKey: privateKey,
        account: account,
    };
}

export function createProviderFromPrivateKey(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    // Create an EIP-1193 compatible provider
    return {
        request: async ({ method, params }: { method: string; params?: any[] }) => {
            if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                return [account.address];
            }
            if (method === 'eth_chainId') {
                return `0x${chain.id.toString(16)}`;
            }
            if (method === 'personal_sign') {
                const [message] = params as [string, string];
                // viem expects { message: { raw: hex } } or string
                // If message is hex, we might need to parse it?
                // account.signMessage expects { message }. If hex string is passed, it treats as string unless formatted?
                // personal_sign message is usually hex encoded string.
                // We should convert hex to bytes or string.
                // UPSClient sends hex string.
                return account.signMessage({ message: { raw: message as `0x${string}` } });
            }
            if (method === 'eth_signTypedData_v4') {
                const [, dataStr] = params as [string, string];
                const data = JSON.parse(dataStr);
                return account.signTypedData({
                    domain: data.domain,
                    types: data.types,
                    primaryType: data.primaryType,
                    message: data.message,
                });
            }
            return client.request({ method: method as any, params: params as any });
        },
    };
}

export async function fundTokens(toAddress: string, amount: bigint) {
    if (!adminClient) {
        throw new Error('Admin client not initialized. check BLOCKCHAIN_PRIVATE_KEY');
    }

    // ABI for transfer: function transfer(address to, uint256 amount) returns (bool)
    const transferSelector = '0xa9059cbb';

    // Pad address to 32 bytes
    const paddedAddress = toAddress.toLowerCase().replace('0x', '').padStart(64, '0');

    // Pad amount to 32 bytes
    const paddedAmount = amount.toString(16).padStart(64, '0');

    const data = `${transferSelector}${paddedAddress}${paddedAmount}` as `0x${string}`;

    const hash = await adminClient.sendTransaction({
        to: config.paymentTokenAddress as `0x${string}`,
        data,
    });

    await publicClient.waitForTransactionReceipt({ hash });
}

export async function getTokenBalance(address: string): Promise<bigint> {
    // ABI for balanceOf: function balanceOf(address account) view returns (uint256)
    const balanceOfSelector = '0x70a08231';

    const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = `${balanceOfSelector}${paddedAddress}` as `0x${string}`;

    const result = await publicClient.call({
        to: config.paymentTokenAddress as `0x${string}`,
        data,
    });

    if (!result || !result.data) return 0n;
    return BigInt(result.data);
}

export async function waitForTx(txHash: string) {
    await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
}

export function randomSalt(): string {
    // Generate a random 32-byte hex string
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
