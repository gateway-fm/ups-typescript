import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../src/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UPSProvider } from '../src/index';
import React from 'react';

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={{ baseUrl: 'http://test.com', network: 'eip155:84532' }}>
                {children}
            </UPSProvider>
        </QueryClientProvider>
    );
};

describe('useAuth', () => {
    it('should return initial unauthenticated state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should have authenticate and logout methods', () => {
        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
        expect(result.current.authenticate).toBeDefined();
        expect(result.current.logout).toBeDefined();
    });
});
