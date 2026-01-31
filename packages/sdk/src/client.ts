import { HttpClient } from './core/http-client';
import { EventBus } from './core/event-bus';
import { AuthManager } from './core/auth-manager';
import { WalletModule } from './wallet';
import { AccountModule } from './account';
import { PaymentModule } from './payment';
import { UPSConfig, ConnectedWallet, EIP1193Provider } from './types';
import { WalletError } from './core/errors';

export class UPSClient {
    readonly config: UPSConfig;
    readonly wallet: WalletModule;
    readonly auth: AuthManager;
    readonly account: AccountModule;
    readonly payment: PaymentModule;

    private http: HttpClient;
    private eventBus: EventBus;

    constructor(config: UPSConfig) {
        this.config = config;

        // Parse chainId if not provided but network is "eip155:123"
        if (!this.config.chainId && this.config.network.startsWith('eip155:')) {
            this.config.chainId = parseInt(this.config.network.split(':')[1], 10);
        }

        this.eventBus = new EventBus();

        this.http = new HttpClient({
            baseUrl: config.baseUrl,
            timeout: config.timeout,
            retryAttempts: config.retryAttempts,
            getToken: () => this.auth.getToken(),
        });

        this.auth = new AuthManager(this.http, this.eventBus);
        this.wallet = new WalletModule(this.eventBus);
        this.account = new AccountModule(this.http);
        this.payment = new PaymentModule(this.http, this.wallet);
    }

    async connect(provider: EIP1193Provider): Promise<ConnectedWallet> {
        return this.wallet.connect(provider);
    }

    async authenticate(): Promise<void> {
        if (!this.wallet.isConnected()) {
            throw new WalletError('Wallet must be connected to authenticate');
        }

        const address = this.wallet.getAddress();
        if (!address) throw new WalletError('No wallet address available');

        // Try Login
        const loginMessage = `Login to UPSx402`; // Matches python test
        try {
            const signature = await this.wallet.signMessage(loginMessage);
            await this.auth.login(address, loginMessage, signature);
        } catch (error: any) {
            // If related to "User not found" or 404/401/400 (Bad Request), try Register
            // We check if it's a request error
            const isAuthError = error.status === 404 || error.status === 401 || error.status === 400 || error.message?.includes('not found') || error.details?.message?.includes('not found');

            if (isAuthError) {
                const registerMessage = `Register for UPSx402`; // Matches python test
                const signature = await this.wallet.signMessage(registerMessage);
                await this.auth.register(address, registerMessage, signature);
            } else {
                throw error;
            }
        }
    }

    async disconnect(): Promise<void> {
        await this.wallet.disconnect();
        this.auth.logout();
    }

    destroy(): void {
        this.auth.logout(); // Clears refresh timer
        this.eventBus.clear();
    }
}
