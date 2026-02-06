import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UPSClient } from '../src/client';

describe('UPSClient', () => {
    let client: UPSClient;

    beforeEach(() => {
        client = new UPSClient({
            baseUrl: 'http://test.com',
            network: 'eip155:737998412',
        });
    });

    it('should initialize with valid config', () => {
        expect(client).toBeDefined();
        // Check if modules are initialized
        expect(client.wallet).toBeDefined();
        expect(client.auth).toBeDefined();
        expect(client.account).toBeDefined();
        expect(client.payment).toBeDefined();
    });

    it('should connect wallet', async () => {
        const mockProvider = { request: vi.fn() };
        vi.spyOn(client.wallet, 'connect').mockResolvedValue({
            address: '0xAddress',
            chainId: 1,
            provider: mockProvider
        });

        const result = await client.connect(mockProvider);
        expect(client.wallet.connect).toHaveBeenCalledWith(mockProvider);
        expect(result.address).toBe('0xAddress');
    });

    it('should authenticate successfully', async () => {
        vi.spyOn(client.wallet, 'isConnected').mockReturnValue(true);
        vi.spyOn(client.wallet, 'getAddress').mockReturnValue('0xAddress');
        vi.spyOn(client.wallet, 'signMessage').mockResolvedValue('0xSignature');

        const mockAuthResult = {
            user: { id: '1', walletAddress: '0xAddress', status: 'active', createdAt: 'date' },
            token: 'jwt-token',
            expiresAt: 'expiry',
            isNewUser: false
        };

        vi.spyOn(client.auth, 'connect').mockResolvedValue(mockAuthResult);

        const result = await client.authenticate();
        expect(client.wallet.signMessage).toHaveBeenCalledWith('Connect to UPSx402');
        expect(client.auth.connect).toHaveBeenCalledWith('0xAddress', 'Connect to UPSx402', '0xSignature');
        expect(result).toEqual(mockAuthResult);
    });

    it('should fail authenticate if wallet not connected', async () => {
        vi.spyOn(client.wallet, 'isConnected').mockReturnValue(false);
        await expect(client.authenticate()).rejects.toThrow('Wallet must be connected');
    });

    it('should fail authenticate if no address', async () => {
        vi.spyOn(client.wallet, 'isConnected').mockReturnValue(true);
        vi.spyOn(client.wallet, 'getAddress').mockReturnValue(null);
        await expect(client.authenticate()).rejects.toThrow('No wallet address available');
    });

    it('should disconnect', async () => {
        vi.spyOn(client.wallet, 'disconnect').mockResolvedValue();
        vi.spyOn(client.auth, 'logout');

        await client.disconnect();
        expect(client.wallet.disconnect).toHaveBeenCalled();
        expect(client.auth.logout).toHaveBeenCalled();
    });

    describe('authenticateLegacy', () => {
        it('should login successfully', async () => {
            vi.spyOn(client.wallet, 'isConnected').mockReturnValue(true);
            vi.spyOn(client.wallet, 'getAddress').mockReturnValue('0xAddress');
            vi.spyOn(client.wallet, 'signMessage').mockResolvedValue('0xSignature');
            vi.spyOn(client.auth, 'login').mockResolvedValue({ token: 't', expiresAt: 'e' });

            await client.authenticateLegacy();
            expect(client.auth.login).toHaveBeenCalled();
        });

        it('should register if login fails with 404', async () => {
            vi.spyOn(client.wallet, 'isConnected').mockReturnValue(true);
            vi.spyOn(client.wallet, 'getAddress').mockReturnValue('0xAddress');
            vi.spyOn(client.wallet, 'signMessage').mockResolvedValue('0xSignature');

            const notFoundError: any = new Error('User not found');
            notFoundError.status = 404;

            vi.spyOn(client.auth, 'login').mockRejectedValue(notFoundError);
            vi.spyOn(client.auth, 'register').mockResolvedValue({ token: 't', expiresAt: 'e' } as any);

            await client.authenticateLegacy();
            expect(client.auth.login).toHaveBeenCalled();
            expect(client.auth.register).toHaveBeenCalled();
        });

        it('should throw other errors', async () => {
            vi.spyOn(client.wallet, 'isConnected').mockReturnValue(true);
            vi.spyOn(client.wallet, 'getAddress').mockReturnValue('0xAddress');

            const otherError: any = new Error('Server error');
            otherError.status = 500;

            vi.spyOn(client.wallet, 'signMessage').mockResolvedValue('0xSignature');
            vi.spyOn(client.auth, 'login').mockRejectedValue(otherError);

            await expect(client.authenticateLegacy()).rejects.toThrow('Server error');
        });
    });

    it('should destroy and clear resources', () => {
        vi.spyOn(client.auth, 'logout');
        // eventBus.clear is hard to spy on without exposing it, but we can verify auth logout
        client.destroy();
        expect(client.auth.logout).toHaveBeenCalled();
    });
});
