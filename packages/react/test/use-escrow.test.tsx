import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, createWrapper } from '../../../test/utils/render';
import { useEscrow, useReleaseEscrow, useRefundEscrow } from '../src/hooks/use-escrow';
import { mockEscrow } from '../../../test/fixtures';
import { useUPSStore } from '../src/store';

describe('useEscrow', () => {
    beforeEach(() => {
        useUPSStore.setState({
            authState: {
                isAuthenticated: true,
                token: 'mock-token',
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() as any,
                address: '0x123'
            }
        });
    });

    afterEach(() => {
        useUPSStore.setState({
            authState: {
                isAuthenticated: false,
                token: null,
                expiresAt: null,
                address: null
            }
        });
    });

    it('should fetch escrow details', async () => {
        const { result } = renderHook(() => useEscrow('esc_123'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockEscrow);
    });

    it('should fetch release escrow', async () => {
        const { result } = renderHook(() => useReleaseEscrow(), { wrapper: createWrapper() });

        await result.current.release('esc_123');
        expect(result.current.isPending).toBe(false);
    });

    it('should fetch refund escrow', async () => {
        const { result } = renderHook(() => useRefundEscrow(), { wrapper: createWrapper() });

        await result.current.refund('esc_123');
        expect(result.current.isPending).toBe(false);
    });
});
