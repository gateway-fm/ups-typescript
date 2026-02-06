import { http, HttpResponse } from 'msw';
import { mockAccount, mockEscrow, mockInvoice } from '../fixtures';

export const handlers = [
    // Auth Handlers
    http.post('*/auth/connect', () => {
        return HttpResponse.json({
            user: {
                id: 'mock-user-id',
                wallet_address: '0xmockwallet',
                status: 'active',
                created_at: new Date().toISOString(),
            },
            token: 'mock-jwt-token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            is_new_user: false,
        });
    }),

    http.post('*/auth/login', () => {
        return HttpResponse.json({
            user: {
                id: 'mock-user-id',
                wallet_address: '0xmockwallet',
                status: 'active',
                created_at: new Date().toISOString(),
            },
            token: 'mock-jwt-token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    }),

    http.post('*/auth/register', () => {
        return HttpResponse.json({
            user: {
                id: 'mock-user-id',
                wallet_address: '0xmockwallet',
                status: 'active',
                created_at: new Date().toISOString(),
            },
            token: 'mock-jwt-token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    }),

    http.post('*/auth/refresh', () => {
        return HttpResponse.json({
            token: 'mock-refreshed-jwt-token',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    }),

    // User Handlers
    http.get('*/users/me', () => {
        return HttpResponse.json({
            user: {
                id: 'mock-user-id',
                wallet_address: '0xmockwallet',
                status: 'active',
                created_at: new Date().toISOString(),
            },
        });
    }),

    // Account Handlers
    http.post('*/accounts', () => {
        return HttpResponse.json({
            account: {
                id: mockAccount.id,
                owner_address: mockAccount.ownerAddress,
                wallet_address: mockAccount.walletAddress,
                status: mockAccount.status,
                kyc_level: mockAccount.kycLevel,
                user_id: 'mock-user-id',
                created_at: mockAccount.createdAt,
                updated_at: mockAccount.updatedAt,
            },
            tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        });
    }),

    http.post('*/accounts/predict', () => {
        return HttpResponse.json({
            wallet_address: '0x1234567890123456789012345678901234567890'
        });
    }),

    http.get('*/accounts', () => {
        return HttpResponse.json({
            accounts: [{
                id: mockAccount.id,
                owner_address: mockAccount.ownerAddress,
                wallet_address: mockAccount.walletAddress,
                status: mockAccount.status,
                kyc_level: mockAccount.kycLevel,
                user_id: 'mock-user-id',
                created_at: mockAccount.createdAt,
                updated_at: mockAccount.updatedAt,
            }]
        });
    }),

    http.get('*/accounts/:id', ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            account: {
                id,
                owner_address: mockAccount.ownerAddress,
                wallet_address: mockAccount.walletAddress,
                status: mockAccount.status,
                kyc_level: mockAccount.kycLevel,
                user_id: 'mock-user-id',
                created_at: mockAccount.createdAt,
                updated_at: mockAccount.updatedAt,
            },
        });
    }),

    // x402 Handlers
    http.post('*/x402/verify', () => {
        return HttpResponse.json({
            isValid: true,
            payer: '0xmockpayer...',
        });
    }),

    http.post('*/x402/settle', () => {
        return HttpResponse.json({
            success: true,
            transaction: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            network: 'eip155:737998412',
            payer: '0xmockpayer...',
        });
    }),

    http.get('*/x402/supported', () => {
        return HttpResponse.json({
            kinds: [
                { x402Version: 1, scheme: 'exact', network: 'eip155:737998412' },
                { x402Version: 1, scheme: 'exact', network: 'eip155:8453' },
            ],
            extensions: [],
            signers: {},
        });
    }),

    // Escrow Handlers
    http.get('*/x402/escrow/:id', ({ params }) => {
        const { id } = params;
        return HttpResponse.json({ ...mockEscrow, id });
    }),

    http.post('*/x402/escrow/:id/release', ({ params }) => {
        // Return updated escrow with RELEASED status
        return HttpResponse.json({ ...mockEscrow, id: params.id, status: 'RELEASED' });
    }),

    http.post('*/x402/escrow/:id/refund', ({ params }) => {
        // Return updated escrow with REFUNDED status
        return HttpResponse.json({ ...mockEscrow, id: params.id, status: 'REFUNDED' });
    }),

    // Invoice Handlers
    http.get('*/invoices', () => {
        return HttpResponse.json({
            invoices: [mockInvoice],
            next_page_token: ''
        });
    }),

    http.get('*/invoices/:id', ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            invoice: { ...mockInvoice, invoice_id: id as string }
        });
    }),

    http.post('*/invoices', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
            invoice: {
                ...mockInvoice,
                ...body,
                invoice_id: 'inv_' + Math.random().toString(36).substr(2, 9)
            }
        });
    }),

    http.post('*/invoices/:id/cancel', ({ params }) => {
        return HttpResponse.json({
            invoice: { ...mockInvoice, invoice_id: params.id as string, status: 'CANCELLED' }
        });
    }),

    // Health
    http.get('*/health', () => {
        return HttpResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
        });
    }),
];
