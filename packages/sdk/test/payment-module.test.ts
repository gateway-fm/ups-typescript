import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModule } from '../src/payment/index';
import { HttpClient } from '../src/core/http-client';
import { WalletModule } from '../src/wallet/index';
import { mockPaymentRequirements } from '../../../test/fixtures';

describe('PaymentModule', () => {
    let paymentModule: PaymentModule;
    let httpClient: HttpClient;
    let walletModule: WalletModule;

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
        const result = await paymentModule.verify({} as any, mockPaymentRequirements);
        expect(result.isValid).toBe(true);
    });

    it('should settle payment', async () => {
        const result = await paymentModule.settle({} as any, mockPaymentRequirements);
        expect(result.success).toBe(true);
        expect(result.txHash).toBe('0xmocktxhash...');
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
});
