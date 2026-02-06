import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
    type Invoice,
    type CreateInvoiceRequest,
    type InvoiceResponse,
    type InvoiceListResponse
} from '@gatewayfm/ups-sdk';
import { useUPSClient } from '../provider';
import { useUPSStore } from '../store';

const invoiceKeys = {
    all: ['invoices'] as const,
    list: (params?: any) => [...invoiceKeys.all, 'list', params] as const,
    detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
};

export function useInvoice(id: string): UseQueryResult<Invoice, Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: async () => {
            const response = await client.invoice.get(id);
            return response.invoice;
        },
        enabled: isAuthenticated && !!id,
    });
}

export interface UseInvoicesParams {
    merchant?: string;
    payer?: string;
    page_size?: number;
    page_token?: string;
}

export function useInvoices(params: UseInvoicesParams = {}): UseQueryResult<InvoiceListResponse, Error> {
    const client = useUPSClient();
    const isAuthenticated = useUPSStore(state => state.authState.isAuthenticated);

    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => client.invoice.list(params),
        enabled: isAuthenticated,
    });
}

export interface UseCreateInvoiceReturn {
    createInvoice: (request: CreateInvoiceRequest) => Promise<InvoiceResponse>;
    isPending: boolean;
    error: Error | null;
    data: InvoiceResponse | undefined;
    reset: () => void;
}

export function useCreateInvoice(): UseCreateInvoiceReturn {
    const client = useUPSClient();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (request: CreateInvoiceRequest) => client.invoice.create(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });

    return {
        createInvoice: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
}

export interface UseCancelInvoiceReturn {
    cancelInvoice: (id: string) => Promise<InvoiceResponse>;
    isPending: boolean;
    error: Error | null;
}

export function useCancelInvoice(): UseCancelInvoiceReturn {
    const client = useUPSClient();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) => client.invoice.cancel(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.invoice.invoice_id) });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
        },
    });

    return {
        cancelInvoice: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
