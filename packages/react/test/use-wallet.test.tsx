import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWallet, UPSProvider } from '../src/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={{ baseUrl: 'http://test.com', network: 'eip155:737998412' }}>
                {children}
            </UPSProvider>
        </QueryClientProvider>
    );
};

describe('useWallet', () => {
    it('should return initial disconnected state', () => {
        const { result } = renderHook(() => useWallet(), { wrapper: createWrapper() });
        expect(result.current.isConnected).toBe(false);
        expect(result.current.address).toBeNull();
    });

    it('should have connect and disconnect methods', () => {
        const { result } = renderHook(() => useWallet(), { wrapper: createWrapper() });
        expect(result.current.connect).toBeDefined();
        expect(result.current.disconnect).toBeDefined();
    });
});
