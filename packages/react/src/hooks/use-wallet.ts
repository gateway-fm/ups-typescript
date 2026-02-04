import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { type EIP1193Provider, type ConnectedWallet, type WalletState } from '@gatewayfm/ups-sdk';
import { useUPSStore } from '../store';
import { useUPSClient } from '../provider';

export interface UseWalletReturn {
    // State
    state: WalletState;
    address: string | null;
    chainId: number | null;
    isConnected: boolean;

    // Actions (TanStack Query mutations)
    connect: UseMutationResult<ConnectedWallet, Error, EIP1193Provider>;
    disconnect: UseMutationResult<void, Error, void>;

    // Direct methods
    signMessage: (message: string) => Promise<string>;
    switchChain: (chainId: number) => Promise<void>;
}

export function useWallet(): UseWalletReturn {
    const client = useUPSClient();
    const walletState = useUPSStore((state) => state.walletState);

    const connectMutation = useMutation({
        mutationFn: async (provider: EIP1193Provider) => {
            return await client.connect(provider);
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: async () => {
            await client.disconnect();
        },
    });

    return {
        state: walletState,
        address: walletState.address,
        chainId: walletState.chainId,
        isConnected: walletState.isConnected,
        connect: connectMutation,
        disconnect: disconnectMutation,
        signMessage: (message: string) => client.wallet.signMessage(message),
        switchChain: (chainId: number) => client.wallet.switchChain(chainId),
    };
}

export interface UseConnectReturn {
    connect: (provider?: EIP1193Provider) => Promise<ConnectedWallet>;
    isPending: boolean;
    error: Error | null;
}

export function useConnect(): UseConnectReturn {
    const { connect } = useWallet();

    const connectFn = async (provider?: EIP1193Provider) => {
        if (provider) {
            return connect.mutateAsync(provider);
        }

        // Default to window.ethereum
        if (typeof window !== 'undefined' && (window as unknown as { ethereum: EIP1193Provider }).ethereum) {
            return connect.mutateAsync((window as unknown as { ethereum: EIP1193Provider }).ethereum);
        }

        throw new Error('No EIP-1193 provider found (window.ethereum is undefined)');
    };

    return {
        connect: connectFn,
        isPending: connect.isPending,
        error: connect.error,
    };
}

export interface UseDisconnectReturn {
    disconnect: () => Promise<void>;
    isPending: boolean;
}

export function useDisconnect(): UseDisconnectReturn {
    const { disconnect } = useWallet();

    return {
        disconnect: async () => {
            await disconnect.mutateAsync();
        },
        isPending: disconnect.isPending,
    };
}
