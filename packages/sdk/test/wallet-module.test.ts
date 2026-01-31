import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletModule } from '../src/wallet/index';
import { EventBus } from '../src/core/event-bus';

describe('WalletModule', () => {
    let walletModule: WalletModule;
    let eventBus: EventBus;
    let mockProvider: any;

    beforeEach(() => {
        eventBus = new EventBus();
        mockProvider = {
            request: vi.fn(async ({ method }) => {
                switch (method) {
                    case 'eth_requestAccounts': return ['0x123...'];
                    case 'eth_chainId': return '0x1'; // Mainnet
                    case 'personal_sign': return '0xsignature';
                    case 'eth_signTypedData_v4': return '0xtypedsignature';
                    default: return null;
                }
            }),
            on: vi.fn(),
            removeListener: vi.fn(),
        };
        walletModule = new WalletModule(eventBus);
    });

    it('should start in disconnected state', () => {
        expect(walletModule.isConnected()).toBe(false);
        expect(walletModule.getAddress()).toBeNull();
    });

    it('should connect to EIP-1193 provider', async () => {
        await walletModule.connect(mockProvider);
        expect(walletModule.isConnected()).toBe(true);
        expect(walletModule.getAddress()).toBe('0x123...');
        expect(walletModule.getChainId()).toBe(1);
    });

    it('should emit wallet:connected event', async () => {
        const spy = vi.fn();
        eventBus.on('wallet:connected', spy);
        await walletModule.connect(mockProvider);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            address: '0x123...',
            chainId: 1,
            isConnected: true,
        }));
    });

    it('should sign message using provider', async () => {
        await walletModule.connect(mockProvider);
        const signature = await walletModule.signMessage('Hello');
        expect(signature).toBe('0xsignature');
        expect(mockProvider.request).toHaveBeenCalledWith({
            method: 'personal_sign',
            params: [expect.any(String), '0x123...']
        });
    });

    it('should disconnect and clear state', async () => {
        await walletModule.connect(mockProvider);
        walletModule.disconnect();
        expect(walletModule.isConnected()).toBe(false);
        expect(walletModule.getAddress()).toBeNull();
    });
});
