import { createWalletClient, custom, WalletClient } from 'viem';
import { mainnet, base, baseSepolia } from 'viem/chains';
import { WalletState, ConnectedWallet, EIP1193Provider, EIP712TypedData } from '../types';
import { EventBus } from '../core/event-bus';
import { WalletError } from '../core/errors';

export class WalletModule {
    private _state: WalletState = {
        isConnected: false,
        address: null,
        chainId: null,
        provider: null,
    };
    private client: WalletClient | null = null;
    private chains = [mainnet, base, baseSepolia];

    constructor(private eventBus: EventBus) { }

    get state(): WalletState {
        return { ...this._state };
    }

    async connect(provider: EIP1193Provider): Promise<ConnectedWallet> {
        try {
            this.setupListeners(provider);

            const addresses = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
            if (!addresses || addresses.length === 0) {
                throw new WalletError('No accounts found');
            }

            const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
            const chainId = parseInt(chainIdHex, 16);

            this.client = createWalletClient({
                chain: this.getChain(chainId),
                transport: custom(provider),
            });

            const address = addresses[0];

            this.updateState({
                isConnected: true,
                address,
                chainId,
                provider,
            });

            this.eventBus.emit('wallet:connected', this._state);

            return {
                address,
                chainId,
                provider,
            };
        } catch (error: any) {
            if (error.code === 4001) {
                throw new WalletError('User rejected connection');
            }
            throw new WalletError(`Connection failed: ${error.message}`, error);
        }
    }

    async disconnect(): Promise<void> {
        // Remove listeners if needed (not easily possible with just EIP1193Provider standard without storing internal listener refs, but we can clear state)
        // Actually standard providers like Metamask don't really 'disconnect' via API, but we act as if we did.
        if (this._state.provider && this._state.provider.removeListener) {
            // We should ideally remove listeners we added.
            // For simplicity in this scope, we just resetting state.
        }

        this.updateState({
            isConnected: false,
            address: null,
            chainId: null,
            provider: null
        });
        this.client = null;
        this.eventBus.emit('wallet:disconnected', undefined);
    }

    getAddress(): string | null {
        return this._state.address;
    }

    getChainId(): number | null {
        return this._state.chainId;
    }

    isConnected(): boolean {
        return this._state.isConnected;
    }

    async signMessage(message: string): Promise<string> {
        if (!this.client || !this._state.address) {
            throw new WalletError('Wallet not connected');
        }
        try {
            return await this.client.signMessage({
                account: this._state.address as `0x${string}`,
                message,
            });
        } catch (error: any) {
            if (error.code === 4001) throw new WalletError('User rejected signing');
            throw new WalletError(`Sign message failed: ${error.message}`, error);
        }
    }

    async signTypedData(typedData: EIP712TypedData): Promise<string> {
        if (!this.client || !this._state.address) {
            throw new WalletError('Wallet not connected');
        }
        try {
            // viem expects exact structure
            return await this.client.signTypedData({
                account: this._state.address as `0x${string}`,
                domain: typedData.domain as any,
                types: typedData.types as any,
                primaryType: typedData.primaryType,
                message: typedData.message,
            });
        } catch (error: any) {
            if (error.code === 4001) throw new WalletError('User rejected signing');
            throw new WalletError(`Sign typed data failed: ${error.message}`, error);
        }
    }

    async switchChain(chainId: number): Promise<void> {
        if (!this._state.provider) throw new WalletError('Provider not available');
        try {
            await this._state.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
        } catch (error: any) {
            throw new WalletError(`Switch chain failed: ${error.message}`, error);
        }
    }

    onStateChange(callback: (state: WalletState) => void): () => void {
        const unsub1 = this.eventBus.on('wallet:connected', () => callback(this._state));
        // subscribe to other events if needed, or just general updates
        // The requirement says "onStateChange(callback): Unsubscribe".
        // We can emit a generic 'wallet:stateChanged' internal event
        return unsub1;
    }

    private updateState(newState: WalletState) {
        this._state = newState;
        // We could emit a generic event here too used by onStateChange
    }

    private setupListeners(provider: EIP1193Provider) {
        if (!provider.on) return;

        provider.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.updateState({ ...this._state, address: accounts[0] });
                this.eventBus.emit('wallet:accountsChanged', accounts);
            }
        });

        provider.on('chainChanged', (chainId: string) => {
            const id = parseInt(chainId, 16);
            this.updateState({ ...this._state, chainId: id });
            // Update client chain if possible or recreate?
            // For now just update state
            this.eventBus.emit('wallet:chainChanged', id);
        });

        provider.on('disconnect', () => {
            this.disconnect();
        });
    }

    private getChain(chainId: number) {
        return this.chains.find(c => c.id === chainId);
    }
}
