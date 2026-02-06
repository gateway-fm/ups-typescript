import { Account, PaymentRequirements, Escrow, Invoice } from '@gatewayfm/ups-sdk';

export const mockAccount: Account = {
    id: 'acc_123',
    ownerAddress: '0x1234567890123456789012345678901234567890',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    status: 'active',
    kycLevel: 0,
    userId: 'mock-user-id',
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

export const mockEscrow: Escrow = {
    id: 'esc_123',
    invoice_id: 'inv_123',
    account_id: 'acc_123',
    amount: '100',
    currency: 'USDT',
    status: 'ACTIVE',
    created_at: 1234567800,
    updated_at: 1234567800,
    transaction_hash: '0x123...'
};

export const mockInvoice: Invoice = {
    invoice_id: 'inv_123',
    merchant: '0x123',
    payer: '0x456',
    amount: '100',
    paid_amount: '0',
    due_date: 1234567890,
    created_at: 1234567800,
    payment_type: 'DIRECT',
    status: 'PENDING',
    metadata_uri: 'ipfs://Qm...'
};
