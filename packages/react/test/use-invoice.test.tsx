import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, createWrapper } from '../../../test/utils/render';
import { useInvoice, useCreateInvoice, useCancelInvoice, useInvoices } from '../src/hooks/use-invoice';
import { useUPSStore } from '../src/store';

describe('useInvoice', () => {
    beforeEach(() => {
        useUPSStore.setState({
            authState: {
                isAuthenticated: true,
                token: 'mock-token',
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() as any,
                address: '0x123'
            }
        });
    });

    afterEach(() => {
        useUPSStore.setState({
            authState: {
                isAuthenticated: false,
                token: null,
                expiresAt: null,
                address: null
            }
        });
    });

    it('should fetch invoice details', async () => {
        const { result } = renderHook(() => useInvoice('inv_123'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeDefined();
    });

    it('should create an invoice', async () => {
        const { result } = renderHook(() => useCreateInvoice(), { wrapper: createWrapper() });

        const request = {
            payer: '0x456',
            amount: '100',
            due_date: 1234567890,
            payment_type: 'DIRECT' as const
        };

        const invoice = await result.current.createInvoice(request);
        expect(invoice).toBeDefined();
    });

    it('should list invoices', async () => {
        const { result } = renderHook(() => useInvoices(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeDefined();
    });

    it('should cancel invoice', async () => {
        const { result } = renderHook(() => useCancelInvoice(), { wrapper: createWrapper() });

        await result.current.cancelInvoice('inv_123');
        expect(result.current.isPending).toBe(false);
    });
});
