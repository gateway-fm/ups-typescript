import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModule } from '../src/payment/index';
import { HttpClient } from '../src/core/http-client';
import { WalletModule } from '../src/wallet/index';
import { mockPaymentRequirements } from '../../../test/fixtures';
import { SignedAuthorization } from '../src/types';

describe('PaymentModule', () => {
    let paymentModule: PaymentModule;
    let httpClient: HttpClient;
    let walletModule: WalletModule;

    const mockSignedAuth: SignedAuthorization = {
        from: '0xsender',
        to: '0xreceiver',
        value: '1000000',
        validAfter: 0,
        validBefore: 9999999999,
        nonce: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: '0xsignature',
    };

    beforeEach(() => {
        httpClient = new HttpClient({ baseUrl: 'http://test.com' });
        walletModule = {
            signTypedData: vi.fn().mockResolvedValue('0xsignature'),
            getAddress: vi.fn().mockReturnValue('0xsender'),
            isConnected: vi.fn().mockReturnValue(true),
        } as any;
        paymentModule = new PaymentModule(httpClient, walletModule);
    });

    it('should verify payment', async () => {
        const result = await paymentModule.verify(mockSignedAuth, mockPaymentRequirements);
        expect(result.isValid).toBe(true);
    });

    it('should settle payment', async () => {
        const result = await paymentModule.settle(mockSignedAuth, mockPaymentRequirements);
        expect(result.success).toBe(true);
        expect(result.transaction).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should execute full pay() flow', async () => {
        const result = await paymentModule.pay({ requirements: mockPaymentRequirements });
        expect(result.success).toBe(true);
        expect(walletModule.signTypedData).toHaveBeenCalled();
    });

    it('should throw error if wallet not connected', async () => {
        walletModule.getAddress = vi.fn().mockReturnValue(null);
        await expect(paymentModule.pay({ requirements: mockPaymentRequirements })).rejects.toThrow();
    });

    it('should get supported schemes', async () => {
        const result = await paymentModule.getSupportedSchemes();
        expect(result.kinds).toBeDefined();
        expect(result.kinds.length).toBeGreaterThan(0);
        expect(result.kinds[0].scheme).toBe('exact');
    });
});
