import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UPSProvider } from '@x402-ups/react';
import App from './App';
import './styles.css';

const queryClient = new QueryClient();

const config = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    network: import.meta.env.VITE_NETWORK_ID || 'eip155:84532',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <UPSProvider config={config}>
                <App />
            </UPSProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
