import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UPSClient, type UPSConfig } from '@gateway-fm/ups-sdk';
import { useUPSStore } from './store';

interface UPSContextValue {
    client: UPSClient | null;
    isInitialized: boolean;
}

const UPSContext = createContext<UPSContextValue>({
    client: null,
    isInitialized: false,
});

export interface UPSProviderProps {
    config: UPSConfig;
    children: React.ReactNode;
}

export const UPSProvider = ({ config, children }: UPSProviderProps) => {
    const setClient = useUPSStore((state) => state.setClient);
    const setWalletState = useUPSStore((state) => state.setWalletState);
    const setAuthState = useUPSStore((state) => state.setAuthState);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize client only once (or when config deep changes, but strictly speaking config shouldn't change often)
    // We use useMemo to hold the instance.
    const client = useMemo(() => {
        return new UPSClient(config);
    }, [JSON.stringify(config)]);

    useEffect(() => {
        setClient(client);

        // Subscribe to state changes
        const unsubWallet = client.wallet.onStateChange((state) => {
            setWalletState(state);
        });

        const unsubAuth = client.auth.onStateChange((state) => {
            setAuthState(state);
        });

        // Initial sync
        setWalletState(client.wallet.state);
        setAuthState(client.auth.state);

        setIsInitialized(true);

        return () => {
            unsubWallet();
            unsubAuth();
            client.destroy();
            setClient(null);
        };
    }, [client, setClient, setWalletState, setAuthState]);

    const value = useMemo(() => ({
        client,
        isInitialized
    }), [client, isInitialized]);

    return <UPSContext.Provider value={value}>{children}</UPSContext.Provider>;
};

export const useUPSContext = () => useContext(UPSContext);

export const useUPSClient = () => {
    const { client } = useUPSContext();
    if (!client) {
        throw new Error('useUPSClient must be used within a UPSProvider');
    }
    return client;
};
