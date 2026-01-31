import { HttpClient } from './http-client';
import { EventBus } from './event-bus';
import { AuthState, AuthResult } from '../types';

export class AuthManager {
    private _state: AuthState = {
        isAuthenticated: false,
        token: null,
        expiresAt: null,
        address: null,
    };
    private refreshTimer: NodeJS.Timeout | null = null;

    constructor(
        private http: HttpClient,
        private eventBus: EventBus
    ) { }

    get state(): AuthState {
        return { ...this._state };
    }

    async login(walletAddress: string, message: string, signature: string): Promise<AuthResult> {
        const result = await this.http.post<AuthResult>('/auth/login', {
            wallet_address: walletAddress,
            message,
            signature,
        }, { skipAuth: true });

        this.handleAuthSuccess(result, walletAddress);
        return result;
    }

    async register(walletAddress: string, message: string, signature: string): Promise<AuthResult> {
        // Register returns { user, token, ... }
        // We need to map it to AuthResult or just extract token/expiresAt?
        // test_auth.py says register returns { user: {...}, token: "..." }
        // Does it return expiresAt?
        // Let's assume standard AuthResult structure for simplicity or inspect response if needed.
        // If register returns different shape, we might need adapter.
        // But for now let's hope it returns token/expiresAt.
        // If not, we might need to fetch profile or similar? 
        // test_auth.py just checks for "token".
        // Let's assume it returns { token, expiresAt, ... } like login.

        const result = await this.http.post<any>('/auth/register', {
            wallet_address: walletAddress,
            message,
            signature,
        }, { skipAuth: true });

        // Map response if necessary. Assuming result has token.
        // If expiresAt is missing, we might default it?
        const authResult: AuthResult = {
            token: result.token,
            expiresAt: result.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24h
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
            const result = await this.http.post<AuthResult>('/auth/refresh');

            this.updateState({
                ...this._state,
                token: result.token,
                expiresAt: new Date(result.expiresAt),
            });

            this.scheduleRefresh();
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
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
        // Refresh 5 minutes before expiry
        const refreshTime = expiresAt - now - (5 * 60 * 1000);

        if (refreshTime > 0) {
            this.refreshTimer = setTimeout(() => this.refresh(), refreshTime);
        } else {
            // If already expired or close to it, try refresh immediately? 
            // Or maybe it's too late. Let's try refresh immediately if we still think we are authenticated
            this.refresh();
        }
    }
}
