import { http, HttpResponse } from 'msw';
import { mockAccount } from '../fixtures';

export const handlers = [
    // Auth Handlers
    http.post('*/auth/connect', () => {
        return HttpResponse.json({
            token: 'mock-jwt-token',
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    }),

    http.post('*/auth/refresh', () => {
        return HttpResponse.json({
            token: 'mock-refreshed-jwt-token',
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        });
    }),

    // Account Handlers
    http.post('*/accounts', () => {
        return HttpResponse.json({
            account: {
                id: mockAccount.id,
                owner_address: mockAccount.ownerAddress,
                wallet_address: mockAccount.walletAddress,
                account_type: mockAccount.accountType,
                status: mockAccount.status,
                kyc_level: mockAccount.kycLevel,
                created_at: mockAccount.createdAt,
                updated_at: mockAccount.updatedAt,
            },
            tx_hash: '0xmocktxhash...'
        });
    }),

    http.post('*/accounts/predict', () => {
        return HttpResponse.json({
            wallet_address: '0xpredictedaddress...'
        });
    }),

    http.get('*/accounts', () => {
        return HttpResponse.json({
            accounts: [{
                id: mockAccount.id,
                owner_address: mockAccount.ownerAddress,
                wallet_address: mockAccount.walletAddress,
                account_type: mockAccount.accountType,
                status: mockAccount.status,
                kyc_level: mockAccount.kycLevel,
                created_at: mockAccount.createdAt,
                updated_at: mockAccount.updatedAt,
            }]
        });
    }),

    http.get('*/accounts/:id', ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            id,
            owner_address: mockAccount.ownerAddress,
            wallet_address: mockAccount.walletAddress,
            account_type: mockAccount.accountType,
            status: mockAccount.status,
            kyc_level: mockAccount.kycLevel,
            created_at: mockAccount.createdAt,
            updated_at: mockAccount.updatedAt,
        });
    }),

    // x402 Handlers
    http.post('*/x402/verify', () => {
        return HttpResponse.json({
            isValid: true,
            details: { amount: '100', currency: 'USD' }
        });
    }),

    http.post('*/x402/settle', () => {
        return HttpResponse.json({
            success: true,
            txHash: '0xmocktxhash...'
        });
    }),
];
