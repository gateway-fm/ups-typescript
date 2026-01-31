import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountModule } from '../src/account/index';
import { HttpClient } from '../src/core/http-client';
import { mockAccount } from '../../../test/fixtures';

describe('AccountModule', () => {
    let accountModule: AccountModule;
    let httpClient: HttpClient;

    beforeEach(() => {
        httpClient = new HttpClient({ baseUrl: 'http://test.com' });
        accountModule = new AccountModule(httpClient);
    });

    it('should create account with owner and salt', async () => {
        const result = await accountModule.create({
            ownerAddress: '0xowner',
            salt: '0xsalt',
        });
        expect(result.account).toEqual(mockAccount);
    });

    it('should predict address before deployment', async () => {
        const result = await accountModule.predictAddress({ ownerAddress: '0xowner', salt: '0xsalt' });
        expect(result).toBe('0xpredictedaddress...');
    });

    it('should get account by ID', async () => {
        const result = await accountModule.get('acc_123');
        expect(result).toEqual(mockAccount);
    });

    it('should list accounts', async () => {
        const result = await accountModule.list();
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockAccount);
    });
});
