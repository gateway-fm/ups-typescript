import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UPSProvider, UPSConfig } from '../../packages/react/src';
import React, { ReactElement, ReactNode } from 'react';

export function renderWithProviders(ui: ReactElement, options?: {
    config?: Partial<UPSConfig>;
}) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const defaultConfig: UPSConfig = {
        baseUrl: 'http://test-api.com',
        network: 'eip155:737998412', // TAU Testnet
        ...options?.config,
    };

    return render(
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={defaultConfig}>
                {ui}
            </UPSProvider>
        </QueryClientProvider>
    );
}

export const createWrapper = (options?: { config?: Partial<UPSConfig> }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const defaultConfig: UPSConfig = {
        baseUrl: 'http://test-api.com',
        network: 'eip155:737998412',
        ...options?.config,
    };

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={defaultConfig}>
                {children}
            </UPSProvider>
        </QueryClientProvider>
    );
};
