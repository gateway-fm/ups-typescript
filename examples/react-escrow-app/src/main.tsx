import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UPSProvider } from '@gateway-fm/ups-react';
import { TokenProvider } from './context/TokenContext';
import { BalanceProviderWrapper } from './context/BalanceProviderWrapper';
import App from './App';
import './styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000, // Data stays fresh for 30 seconds
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
        },
    },
});

const config = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    network: import.meta.env.VITE_NETWORK_ID || 'eip155:737998412',
    refreshInterval: 60 * 60 * 1000, // 1 hour
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={config}>
                <TokenProvider>
                    <BalanceProviderWrapper>
                        <App />
                    </BalanceProviderWrapper>
                </TokenProvider>
            </UPSProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
