import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { type Escrow, type EscrowActionResponse } from '@gatewayfm/ups-sdk';
import { useUPSClient } from '../provider';
import { useUPSStore } from '../store';

const escrowKeys = {
    all: ['escrows'] as const,
    detail: (id: string) => [...escrowKeys.all, 'detail', id] as const,
};

export function useEscrow(id: string): UseQueryResult<Escrow, Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: escrowKeys.detail(id),
        queryFn: () => client.escrow.get(id),
        enabled: isAuthenticated && !!id,
    });
}

export interface UseReleaseEscrowReturn {
    release: (id: string) => Promise<EscrowActionResponse>;
    isPending: boolean;
    error: Error | null;
}

export function useReleaseEscrow(): UseReleaseEscrowReturn {
    const client = useUPSClient();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => client.escrow.release(id, client.config.network),
        onSuccess: (data, variables) => {
            // Invalidate using the ID passed to mutate (variables), not data.id because EscrowActionResponse might not have id or it might be different structure
            // EscrowActionResponse: { success, errorReason, transaction, network } - DOES NOT HAVE ID.
            // So we must use 'variables' (the id passed to mutate).
            queryClient.invalidateQueries({ queryKey: escrowKeys.detail(variables) });
        },
    });

    return {
        release: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

export interface UseRefundEscrowReturn {
    refund: (id: string) => Promise<EscrowActionResponse>;
    isPending: boolean;
    error: Error | null;
}

export function useRefundEscrow(): UseRefundEscrowReturn {
    const client = useUPSClient();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => client.escrow.refund(id, client.config.network),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: escrowKeys.detail(variables) });
        },
    });

    return {
        refund: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
