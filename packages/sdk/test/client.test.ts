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

    it('should destroy and clear resources', () => {
        client.destroy();
        // Check internal state if possible, or ensure no errors
    });
});
