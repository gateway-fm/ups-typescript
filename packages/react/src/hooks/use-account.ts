import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { type Account, type CreateAccountParams, type CreateAccountResponse } from '@gatewayfm/ups-sdk';
import { useUPSStore } from '../store';
import { useUPSClient } from '../provider';

const accountKeys = {
    all: ['accounts'] as const,
    list: () => [...accountKeys.all, 'list'] as const,
    detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
    byWallet: (address: string) => [...accountKeys.all, 'wallet', address] as const,
};

export function useAccounts(): UseQueryResult<Account[], Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: accountKeys.list(),
        queryFn: () => client.account.list(),
        enabled: isAuthenticated,
    });
}

export function useAccount(id: string): UseQueryResult<Account, Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: accountKeys.detail(id),
        queryFn: () => client.account.get(id),
        enabled: isAuthenticated && !!id,
    });
}

export function useAccountByWallet(address: string | null): UseQueryResult<Account, Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: accountKeys.byWallet(address || ''),
        queryFn: () => client.account.getByWallet(address!),
        enabled: isAuthenticated && !!address,
    });
}

export interface UsePredictAddressReturn {
    predictAddress: (owner: string, salt: string) => Promise<string>;
    isPending: boolean;
    error: Error | null;
}

export function usePredictAddress(): UsePredictAddressReturn {
    const client = useUPSClient();
    const mutation = useMutation({
        mutationFn: (params: { owner: string, salt: string }) =>
            client.account.predictAddress({ ownerAddress: params.owner, salt: params.salt }),
    });

    return {
        predictAddress: (owner, salt) => mutation.mutateAsync({ owner, salt }),
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

export interface UseCreateAccountReturn {
    createAccount: (params: CreateAccountParams) => Promise<CreateAccountResponse>;
    isPending: boolean;
    error: Error | null;
    data: CreateAccountResponse | undefined;
    reset: () => void;
}

export function useCreateAccount(): UseCreateAccountReturn {
    const client = useUPSClient();
    const queryClient = useQueryClient();
    const setCurrentAccount = useUPSStore(state => state.setCurrentAccount);

    const mutation = useMutation({
        mutationFn: (params: CreateAccountParams) => client.account.create(params),
        onSuccess: (data) => {
            setCurrentAccount(data.account);
            queryClient.invalidateQueries({ queryKey: accountKeys.list() });
        },
    });

    return {
        createAccount: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
}

export function useCurrentAccount(): Account | null {
    return useUPSStore(state => state.currentAccount);
}

export function generateSalt(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        // Fallback for non-browser environments if needed (e.g. during build/test)
        for (let i = 0; i < 32; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
