import { describe, it, expect, beforeEach } from 'vitest';
import { UserModule } from '../src/user';
import { HttpClient } from '../src/core/http-client';

describe('UserModule', () => {
    let userModule: UserModule;
    let httpClient: HttpClient;

    beforeEach(() => {
        httpClient = new HttpClient({ baseUrl: 'http://test.com' });
        userModule = new UserModule(httpClient);
    });

    it('should get current user', async () => {
        const user = await userModule.getCurrentUser();
        expect(user).toBeDefined();
        expect(user.id).toBe('mock-user-id');
        expect(user.walletAddress).toBe('0xmockwallet');
        expect(user.status).toBe('active');
    });
});
