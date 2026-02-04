import { HttpClient } from '../core/http-client';
import { Escrow, EscrowActionResponse } from '../types';

export class EscrowModule {
    constructor(private http: HttpClient) { }

    /**
     * Get escrow details by ID
     * @param escrowId Escrow ID
     */
    async get(escrowId: string): Promise<Escrow> {
        return this.http.get<Escrow>(`/x402/escrow/${escrowId}`, { skipAuth: false });
    }

    /**
     * Release escrow funds (Payer or Arbiter only)
     * @param escrowId Escrow ID
     */
    async release(escrowId: string, network: string): Promise<EscrowActionResponse> {
        return this.http.post<EscrowActionResponse>(`/x402/escrow/${escrowId}/release`, {
            network
        });
    }

    /**
     * Refund escrow funds (Arbiter only)
     * @param escrowId Escrow ID
     */
    async refund(escrowId: string, network: string): Promise<EscrowActionResponse> {
        return this.http.post<EscrowActionResponse>(`/x402/escrow/${escrowId}/refund`, {
            network
        });
    }
}
