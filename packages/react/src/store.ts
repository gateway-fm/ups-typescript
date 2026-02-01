import { create } from 'zustand';
import type { UPSClient, WalletState, AuthState, Account } from '@gateway-fm/ups-sdk';

export interface UPSStore {
    // Client instance
    client: UPSClient | null;
    setClient: (client: UPSClient | null) => void;

    // Wallet state (synced from SDK)
    walletState: WalletState;
    setWalletState: (state: WalletState) => void;

    // Auth state (synced from SDK)
    authState: AuthState;
    setAuthState: (state: AuthState) => void;

    // Current user's account (after creation)
    currentAccount: Account | null;
    setCurrentAccount: (account: Account | null) => void;
}

export const useUPSStore = create<UPSStore>((set) => ({
    client: null,
    setClient: (client) => set({ client }),

    walletState: {
        address: null,
        chainId: null,
        isConnected: false,
        provider: null,
    },
    setWalletState: (walletState) => set({ walletState }),

    authState: {
        isAuthenticated: false,
        token: null,
        expiresAt: null,
        address: null,
    },
    setAuthState: (authState) => set({ authState }),

    currentAccount: null,
    setCurrentAccount: (currentAccount) => set({ currentAccount }),
}));
