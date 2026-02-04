import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscrowModule } from '../src/escrow';
import { HttpClient } from '../src/core/http-client';
import { Escrow, EscrowActionResponse } from '../src/types';

describe('EscrowModule', () => {
    let escrowModule: EscrowModule;
    let mockHttp: any;

    beforeEach(() => {
        mockHttp = {
            get: vi.fn(),
            post: vi.fn(),
        };
        escrowModule = new EscrowModule(mockHttp as unknown as HttpClient);
    });

    it('should get escrow details', async () => {
        const mockEscrow: Escrow = {
            escrowId: '0x123',
            payer: '0xPayer',
            payee: '0xPayee',
            amount: '100',
            arbiter: '0xArbiter',
            releaseTime: 1234567890,
            status: 'ACTIVE'
        };

        mockHttp.get.mockResolvedValue(mockEscrow);

        const result = await escrowModule.get('0x123');
        expect(result).toEqual(mockEscrow);
        expect(mockHttp.get).toHaveBeenCalledWith('/x402/escrow/0x123', { skipAuth: false });
    });

    it('should release escrow', async () => {
        const mockResponse: EscrowActionResponse = {
            success: true,
            transaction: '0xTxHash',
            network: 'eip155:737998412'
        };

        mockHttp.post.mockResolvedValue(mockResponse);

        const result = await escrowModule.release('0x123', 'eip155:737998412');
        expect(result).toEqual(mockResponse);
        expect(mockHttp.post).toHaveBeenCalledWith('/x402/escrow/0x123/release', {
            network: 'eip155:737998412'
        });
    });

    it('should refund escrow', async () => {
        const mockResponse: EscrowActionResponse = {
            success: true,
            transaction: '0xTxHash',
            network: 'eip155:737998412'
        };

        mockHttp.post.mockResolvedValue(mockResponse);

        const result = await escrowModule.refund('0x123', 'eip155:737998412');
        expect(result).toEqual(mockResponse);
        expect(mockHttp.post).toHaveBeenCalledWith('/x402/escrow/0x123/refund', {
            network: 'eip155:737998412'
        });
    });
});
