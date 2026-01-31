import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts, useAccount, useCreateAccount, usePredictAddress } from '../src/hooks/use-account';
import { createWrapper } from '../../../test/utils/render';
import { useUPSStore } from '../src/store';
import { server } from '../../../test/mocks/server';

describe('useAccounts', () => {
    beforeEach(() => {
        useUPSStore.setState({
            authState: {
                isAuthenticated: true,
                token: 'mock-token',
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() as any, // Cast for mock match
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
    it('should fetch accounts', async () => {
        const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
        await waitFor(() => {
            if (!result.current.isSuccess) {
                console.log('accounts status:', result.current.status);
                console.log('accounts error:', result.current.error);
            }
            expect(result.current.isSuccess).toBe(true);
        });
        expect(result.current.data).toBeDefined();
        expect(result.current.data).toHaveLength(1);
    });
});

describe('useAccount', () => {
    it.skip('should fetch account by ID', async () => {
        const { result } = renderHook(() => useAccount('acc_123'), { wrapper: createWrapper() });
        await waitFor(() => {
            if (!result.current.isSuccess) {
                console.log('account by ID status:', result.current.status);
                console.log('account by ID error:', result.current.error);
            }
            expect(result.current.isSuccess).toBe(true);
        });
        expect(result.current.data).toBeDefined();
        expect(result.current.data?.id).toBe('acc_123');
    });
});

describe('useCreateAccount', () => {
    it('should expose createAccount method', () => {
        const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });
        expect(result.current.createAccount).toBeDefined();
    });
});
