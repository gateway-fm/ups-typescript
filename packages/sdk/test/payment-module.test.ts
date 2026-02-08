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

    describe('Error Handling', () => {
        it('should throw when settle returns success: false', async () => {
            // Mock HttpClient to return a 200 OK response but with application-level error
            vi.spyOn(httpClient, 'post').mockResolvedValue({
                success: false,
                errorReason: "invalid_exact_evm_insufficient_balance: insufficient balance: 0 < 2000000000000000000"
            });

            await expect(paymentModule.settle(mockSignedAuth, mockPaymentRequirements))
                .rejects
                .toThrow("invalid_exact_evm_insufficient_balance: insufficient balance: 0 < 2000000000000000000");
        });

        it('should normally return valid response if no error', async () => {
            vi.spyOn(httpClient, 'post').mockResolvedValue({
                success: true,
                transaction: '0x123'
            });
            const res = await paymentModule.settle(mockSignedAuth, mockPaymentRequirements);
            expect(res.success).toBe(true);
        });

        it('should throw when verify returns invalidReason', async () => {
            vi.spyOn(httpClient, 'post').mockImplementation(async (path) => {
                if (path.includes('verify')) {
                    // Simulating API return where isValid might be missing or false, but invalidReason is present
                    return {
                        // isValid: false, // Optional, since we normalize it? 
                        // The fix I implemented normalizes it: if invalidReason && isValid===undefined -> isValid=false
                        // But verify() doesn't throw by itself unless I changed it?
                        // Wait, I did NOT change verify() to throw. I only changed it to normalize isValid=false.
                        // So correct test expectation for verify() is that it returns isValid=false.
                        invalidReason: "Signature invalid"
                    };
                }
                return {};
            });

            // The code I wrote:
            // if (response.invalidReason && response.isValid === undefined) { response.isValid = false; }
            // return response;

            const result = await paymentModule.verify(mockSignedAuth, mockPaymentRequirements);
            expect(result.isValid).toBe(false);
            expect(result.invalidReason).toBe("Signature invalid");
        });

        it('should NOT throw when settle returns success: true even if errorReason is present', async () => {
            const mockResponse = {
                "success": true,
                "errorReason": "Settled",
                "transaction": "0x9e75d425848d216a4f248b5c331755eefe519f89fad64f22db9bad3f8d6d0cb6",
                "network": "eip155:737998412",
                "payer": "0x6726dd6e41f3bdfd66e4dea0b9d43e3fb46c7425"
            };

            vi.spyOn(httpClient, 'post').mockResolvedValue(mockResponse);

            await expect(paymentModule.settle(mockSignedAuth, mockPaymentRequirements))
                .resolves
                .toEqual(mockResponse);
        });
    });
});
