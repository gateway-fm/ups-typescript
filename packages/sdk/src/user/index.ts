import { HttpClient } from '../core/http-client';
import { User } from '../types';

/**
 * UserModule provides access to user profile operations.
 * 
 * @example
 * ```typescript
 * const user = await client.user.getCurrentUser();
 * console.log(user.id, user.walletAddress);
 * ```
 */
export class UserModule {
    constructor(private http: HttpClient) { }

    /**
     * Get the current authenticated user's profile.
     * Requires authentication.
     */
    async getCurrentUser(): Promise<User> {
        const response = await this.http.get<{ user: unknown }>('/users/me');
        return this.mapUser(response.user);
    }

    private mapUser(data: any): User {
        const d = data as any;
        return {
            id: d.id,
            walletAddress: d.wallet_address,
            status: d.status,
            createdAt: d.created_at,
        };
    }
}
