import { HttpClient } from '../core/http-client';
import {
    CreateInvoiceRequest,
    InvoiceResponse,
    InvoiceListResponse
} from '../types';

export class InvoiceModule {
    constructor(private http: HttpClient) { }

    /**
     * Create a new invoice
     * @param request Invoice creation details
     */
    async create(request: CreateInvoiceRequest): Promise<InvoiceResponse> {
        return this.http.post<InvoiceResponse>('/invoices', request);
    }

    /**
     * Get invoice by ID
     * @param id Invoice ID
     */
    async get(id: string): Promise<InvoiceResponse> {
        return this.http.get<InvoiceResponse>(`/invoices/${id}`);
    }

    /**
     * List invoices
     * @param params Filter parameters
     */
    async list(params?: { merchant?: string; payer?: string; page_size?: number; page_token?: string }): Promise<InvoiceListResponse> {
        const query = new URLSearchParams();
        if (params?.merchant) query.append('merchant', params.merchant);
        if (params?.payer) query.append('payer', params.payer);
        if (params?.page_size) query.append('page_size', params.page_size.toString());
        if (params?.page_token) query.append('page_token', params.page_token);

        const queryString = query.toString();
        const path = queryString ? `/invoices?${queryString}` : '/invoices';

        return this.http.get<InvoiceListResponse>(path);
    }

    /**
     * Cancel invoice
     * @param id Invoice ID
     */
    async cancel(id: string): Promise<InvoiceResponse> {
        return this.http.post<InvoiceResponse>(`/invoices/${id}/cancel`, {});
    }
}
