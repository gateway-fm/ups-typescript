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
        const response = await this.http.get<{ user: any }>('/users/me');
        return this.mapUser(response.user);
    }

    private mapUser(data: any): User {
        return {
            id: data.id,
            walletAddress: data.wallet_address,
            status: data.status,
            createdAt: data.created_at,
        };
    }
}
