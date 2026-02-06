import { HttpClient } from '../core/http-client';
import { Account, CreateAccountParams, CreateAccountResponse } from '../types';

export class AccountModule {
    constructor(private http: HttpClient) { }

    async get(id: string): Promise<Account> {
        const response = await this.http.get<{ account: unknown }>(`/accounts/${id}`);
        return this.mapAccount(response.account);
    }

    async getByWallet(address: string): Promise<Account> {
        // Assuming API supports query param or specific endpoint. 
        // The task list says "GET /accounts -> { accounts: [...] }". 
        // It doesn't explicitly have a "get by wallet" endpoint, but usually list filters.
        // Or maybe we filter the list.
        // "GET /accounts" implies listing current user's accounts usually?
        const response = await this.list();
        const account = response.find(a => a.walletAddress.toLowerCase() === address.toLowerCase());
        if (!account) {
            throw new Error('Account not found for wallet');
        }
        return account;
    }

    async list(): Promise<Account[]> {
        const response = await this.http.get<{ accounts: unknown[] }>('/accounts');
        return response.accounts.map(this.mapAccount);
    }

    async create(params: CreateAccountParams): Promise<CreateAccountResponse> {
        const response = await this.http.post<any>('/accounts', {
            owner_address: params.ownerAddress,
            salt: params.salt,
        });

        return {
            account: this.mapAccount(response.account),
            txHash: response.tx_hash,
        };
    }

    async predictAddress(params: { ownerAddress: string; salt: string }): Promise<string> {
        const response = await this.http.post<{ wallet_address: string }>('/accounts/predict', {
            owner_address: params.ownerAddress,
            salt: params.salt,
        });
        return response.wallet_address;
    }

    private mapAccount(data: any): Account {
        // Map snake_case to camelCase
        const d = data as any;
        return {
            id: d.id,
            ownerAddress: d.owner_address,
            walletAddress: d.wallet_address,
            status: d.status,
            kycLevel: d.kyc_level ?? 0,
            userId: d.user_id,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
        };
    }
}
