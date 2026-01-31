import { Account, PaymentRequirements } from '@x402-ups/sdk';

export const mockAccount: Account = {
    id: 'acc_123',
    ownerAddress: '0x1234567890123456789012345678901234567890',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    accountType: 'USER',
    status: 'active',
    kycLevel: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

export const mockPaymentRequirements: PaymentRequirements = {
    scheme: 'exact',
    network: 'eip155:84532',
    maxAmountRequired: '10000000',
    asset: '0x0000000000000000000000000000000000000000',
    payTo: '0xmerchantaddress12345678901234567890',
    maxTimeoutSeconds: 3600,
    extra: { name: 'x402 Payment Token', version: '1' },
};
