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

    private mapUser(data: unknown): User {
        const d = data as Record<string, unknown>;
        return {
            id: d.id as string,
            walletAddress: d.wallet_address as string,
            status: d.status as User['status'],
            createdAt: d.created_at as string,
        };
    }
}
