import { LocalAccount } from 'viem/accounts';
import { EIP1193Provider } from '@x402-ups/sdk';

export function createMockProvider(account: LocalAccount): EIP1193Provider {
    return {
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
            switch (method) {
                case 'eth_requestAccounts':
                case 'eth_accounts':
                    return [account.address];
                case 'eth_chainId':
                    return '0x14a34'; // 84532 Base Sepolia
                case 'personal_sign': {
                    const [message, address] = params as [string, string];
                    if (address.toLowerCase() !== account.address.toLowerCase()) {
                        throw new Error('Address mismatch');
                    }
                    return account.signMessage({ message });
                }
                case 'eth_signTypedData_v4': {
                    const [addr, data] = params as [string, string];
                    if (addr.toLowerCase() !== account.address.toLowerCase()) {
                        throw new Error('Address mismatch');
                    }
                    const typedData = JSON.parse(data);
                    return account.signTypedData({
                        domain: typedData.domain,
                        types: typedData.types,
                        primaryType: typedData.primaryType,
                        message: typedData.message,
                    });
                }
                default:
                    throw new Error(`Method ${method} not implemented`);
            }
        },
    };
}
