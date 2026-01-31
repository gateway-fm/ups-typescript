import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from '../src/core/auth-manager';
import { HttpClient } from '../src/core/http-client';
import { EventBus } from '../src/core/event-bus';

describe('AuthManager', () => {
    let authManager: AuthManager;
    let httpClient: HttpClient;
    let eventBus: EventBus;

    beforeEach(() => {
        httpClient = new HttpClient({ baseUrl: 'http://test.com' });
        eventBus = new EventBus();
        authManager = new AuthManager(httpClient, eventBus);
        // localStorage mock might be missing clear
        if (typeof localStorage !== 'undefined') {
            localStorage.clear?.();
        }
    });

    it('should start in unauthenticated state', () => {
        expect(authManager.isAuthenticated()).toBe(false);
        expect(authManager.getToken()).toBeNull();
    });

    it('should authenticate with valid credentials', async () => {
        const result = await authManager.authenticate('0xwallet', 'message', 'signature');
        expect(result).toBeDefined();
        expect(authManager.isAuthenticated()).toBe(true);
        expect(authManager.getToken()).toBe('mock-jwt-token');
    });

    it('should emit auth:changed event on authentication', async () => {
        const spy = vi.fn();
        eventBus.on('auth:changed', spy);
        await authManager.authenticate('0xwallet', 'message', 'signature');
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ isAuthenticated: true }));
    });

    it('should logout and clear state', async () => {
        await authManager.authenticate('0xwallet', 'message', 'signature');
        authManager.logout();
        expect(authManager.isAuthenticated()).toBe(false);
        expect(authManager.getToken()).toBeNull();
    });

    it('should emit auth:changed event on logout', async () => {
        await authManager.authenticate('0xwallet', 'message', 'signature');
        const spy = vi.fn();
        eventBus.on('auth:changed', spy);
        authManager.logout();
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ isAuthenticated: false }));
    });
});
