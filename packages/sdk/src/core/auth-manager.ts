import { HttpClient } from './http-client';
import { EventBus } from './event-bus';
import { AuthState, AuthResult, ConnectResult, User } from '../types';

export class AuthManager {
    private _state: AuthState = {
        isAuthenticated: false,
        token: null,
        expiresAt: null,
        address: null,
    };
    private refreshTimer: NodeJS.Timeout | null = null;
    private refreshInterval: number;

    constructor(
        private http: HttpClient,
        private eventBus: EventBus,
        refreshInterval: number = 60000 // Default 1 minute
    ) {
        this.refreshInterval = refreshInterval;
    }

    get state(): AuthState {
        return { ...this._state };
    }

    /**
     * Unified connect method - creates user if new, authenticates if existing
     * This is the preferred authentication method.
     */
    async connect(walletAddress: string, message: string, signature: string): Promise<ConnectResult> {
        const result = await this.http.post<{ user: unknown; token: string; expires_at: string; is_new_user?: boolean }>('/auth/connect', {
            wallet_address: walletAddress,
            message,
            signature,
        }, { skipAuth: true });

        const connectResult: ConnectResult = {
            user: this.mapUser(result.user),
            token: result.token,
            expiresAt: result.expires_at,
            isNewUser: result.is_new_user ?? false,
        };

        this.handleAuthSuccess({ token: result.token, expiresAt: result.expires_at }, walletAddress);
        return connectResult;
    }

    /**
     * @deprecated Use connect() instead
     */
    async login(walletAddress: string, message: string, signature: string): Promise<AuthResult> {
        const result = await this.http.post<{ token: string; expires_at?: string; expiresAt?: string }>('/auth/login', {
            wallet_address: walletAddress,
            message,
            signature,
        }, { skipAuth: true });

        const authResult: AuthResult = {
            token: result.token,
            expiresAt: result.expires_at || result.expiresAt,
        };

        this.handleAuthSuccess(authResult, walletAddress);
        return authResult;
    }

    /**
     * @deprecated Use connect() instead
     */
    async register(walletAddress: string, message: string, signature: string): Promise<AuthResult> {
        const result = await this.http.post<{ token: string; expires_at?: string; expiresAt?: string }>('/auth/register', {
            wallet_address: walletAddress,
            message,
            signature,
        }, { skipAuth: true });

        const authResult: AuthResult = {
            token: result.token,
            expiresAt: result.expires_at || result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        this.handleAuthSuccess(authResult, walletAddress);
        return authResult;
    }

    private handleAuthSuccess(result: AuthResult, walletAddress: string) {
        this.updateState({
            isAuthenticated: true,
            token: result.token,
            expiresAt: new Date(result.expiresAt),
            address: walletAddress,
        });
        this.scheduleRefresh();
    }

    async refresh(): Promise<void> {
        if (!this._state.token) return;

        try {
            const result = await this.http.post<{ token: string; expires_at: string }>('/auth/refresh');

            this.updateState({
                ...this._state,
                token: result.token,
                expiresAt: new Date(result.expires_at),
            });

            this.scheduleRefresh();
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
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

    logout(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        this.updateState({
            isAuthenticated: false,
            token: null,
            expiresAt: null,
            address: null,
        });
    }

    getToken(): string | null {
        return this._state.token;
    }

    isAuthenticated(): boolean {
        return this._state.isAuthenticated;
    }

    onStateChange(callback: (state: AuthState) => void): () => void {
        return this.eventBus.on('auth:changed', callback);
    }

    private updateState(newState: AuthState) {
        this._state = newState;
        this.eventBus.emit('auth:changed', this._state);
    }

    private scheduleRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        if (!this._state.expiresAt) return;

        const expiresAt = this._state.expiresAt.getTime();
        const now = Date.now();

        // If token is already expired, don't schedule refresh
        if (expiresAt <= now) {
            return;
        }

        // Schedule refresh at the configured interval (e.g., 1 hour)
        // But ensure we refresh before the token expires
        const timeUntilExpiry = expiresAt - now;
        const refreshTime = Math.min(this.refreshInterval, timeUntilExpiry - 60000); // At least 1 min buffer

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => this.refresh(), refreshTime);
        }
    }
}
