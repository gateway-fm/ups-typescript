import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceModule } from '../src/invoice';
import { HttpClient } from '../src/core/http-client';
import { CreateInvoiceRequest, InvoiceResponse, InvoiceListResponse } from '../src/types';

describe('InvoiceModule', () => {
    let invoiceModule: InvoiceModule;
    let mockHttp: any;

    beforeEach(() => {
        mockHttp = {
            get: vi.fn(),
            post: vi.fn(),
        };
        invoiceModule = new InvoiceModule(mockHttp as unknown as HttpClient);
    });

    it('should create an invoice', async () => {
        const request: CreateInvoiceRequest = {
            amount: '100',
            payer: '0xPayer',
            due_date: 1234567890,
            payment_type: 'DIRECT',
            metadata_uri: 'ipfs://...'
        };

        const mockResponse: InvoiceResponse = {
            invoice: {
                invoice_id: '1',
                merchant: '0xMerchant',
                payer: '0xPayer',
                amount: '100',
                paid_amount: '0',
                due_date: 1234567890,
                created_at: 1234567000,
                payment_type: 'DIRECT',
                status: 'PENDING',
                metadata_uri: 'ipfs://...'
            }
        };

        mockHttp.post.mockResolvedValue(mockResponse);

        const result = await invoiceModule.create(request);
        expect(result).toEqual(mockResponse);
        expect(mockHttp.post).toHaveBeenCalledWith('/invoices', request);
    });

    it('should get an invoice', async () => {
        const mockResponse: InvoiceResponse = {
            invoice: {
                invoice_id: '1',
                merchant: '0xMerchant',
                payer: '0xPayer',
                amount: '100',
                paid_amount: '0',
                due_date: 1234567890,
                created_at: 1234567000,
                payment_type: 'DIRECT',
                status: 'PENDING',
                metadata_uri: 'ipfs://...'
            }
        };

        mockHttp.get.mockResolvedValue(mockResponse);

        const result = await invoiceModule.get('1');
        expect(result).toEqual(mockResponse);
        expect(mockHttp.get).toHaveBeenCalledWith('/invoices/1');
    });

    it('should list invoices', async () => {
        const mockResponse: InvoiceListResponse = {
            invoices: [],
            next_page_token: ''
        };

        mockHttp.get.mockResolvedValue(mockResponse);

        const params = { merchant: '0xMerchant' };
        const result = await invoiceModule.list(params);
        expect(result).toEqual(mockResponse);
        expect(mockHttp.get).toHaveBeenCalledWith('/invoices?merchant=0xMerchant');
    });

    it('should cancel an invoice', async () => {
        const mockResponse: InvoiceResponse = {
            invoice: {
                invoice_id: '1',
                merchant: '0xMerchant',
                payer: '0xPayer',
                amount: '100',
                paid_amount: '0',
                due_date: 1234567890,
                created_at: 1234567000,
                payment_type: 'DIRECT',
                status: 'CANCELLED',
                metadata_uri: 'ipfs://...'
            }
        };

        mockHttp.post.mockResolvedValue(mockResponse);

        const result = await invoiceModule.cancel('1');
        expect(result).toEqual(mockResponse);
        expect(mockHttp.post).toHaveBeenCalledWith('/invoices/1/cancel', {});
    });
});
