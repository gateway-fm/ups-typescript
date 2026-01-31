import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePayment, usePaymentVerify, usePaymentSettle } from '../src/index';
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

describe('usePayment', () => {
    it('should expose pay method', () => {
        const { result } = renderHook(() => usePayment(), { wrapper: createWrapper() });
        expect(result.current.pay).toBeDefined();
    });
});

describe('usePaymentVerify', () => {
    it('should expose verify method', () => {
        const { result } = renderHook(() => usePaymentVerify(), { wrapper: createWrapper() });
        expect(result.current.verify).toBeDefined();
    });
});

describe('usePaymentSettle', () => {
    it('should expose settle method', () => {
        const { result } = renderHook(() => usePaymentSettle(), { wrapper: createWrapper() });
        expect(result.current.settle).toBeDefined();
    });
});
