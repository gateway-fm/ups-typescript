import { HttpClient } from './core/http-client';
import { EventBus } from './core/event-bus';
import { AuthManager } from './core/auth-manager';
import { WalletModule } from './wallet';
import { AccountModule } from './account';
import { PaymentModule } from './payment';
import { EscrowModule } from './escrow';
import { UserModule } from './user';
import { UPSConfig, ConnectedWallet, EIP1193Provider, ConnectResult } from './types';
import { WalletError } from './core/errors';

export class UPSClient {
    readonly config: UPSConfig;
    readonly wallet: WalletModule;
    readonly auth: AuthManager;
    readonly account: AccountModule;
    readonly payment: PaymentModule;
    readonly escrow: EscrowModule;
    readonly user: UserModule;

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

        this.auth = new AuthManager(this.http, this.eventBus, config.refreshInterval);
        this.wallet = new WalletModule(this.eventBus);
        this.account = new AccountModule(this.http);
        this.payment = new PaymentModule(this.http, this.wallet);
        this.escrow = new EscrowModule(this.http);
        this.user = new UserModule(this.http);
    }

    async connect(provider: EIP1193Provider): Promise<ConnectedWallet> {
        return this.wallet.connect(provider);
    }

    /**
     * Authenticate with the UPS backend using the unified /auth/connect endpoint.
     * This will create a new user if one doesn't exist, or authenticate an existing user.
     * 
     * @returns ConnectResult containing user info and whether this is a new user
     */
    async authenticate(): Promise<ConnectResult> {
        if (!this.wallet.isConnected()) {
            throw new WalletError('Wallet must be connected to authenticate');
        }

        const address = this.wallet.getAddress();
        if (!address) throw new WalletError('No wallet address available');

        const message = `Connect to UPSx402`;
        const signature = await this.wallet.signMessage(message);

        return this.auth.connect(address, message, signature);
    }

    /**
     * @deprecated Use authenticate() instead which uses the unified /auth/connect endpoint.
     * This method uses the legacy login/register flow.
     */
    async authenticateLegacy(): Promise<void> {
        if (!this.wallet.isConnected()) {
            throw new WalletError('Wallet must be connected to authenticate');
        }

        const address = this.wallet.getAddress();
        if (!address) throw new WalletError('No wallet address available');

        // Try Login
        const loginMessage = `Login to UPSx402`;
        try {
            const signature = await this.wallet.signMessage(loginMessage);
            await this.auth.login(address, loginMessage, signature);
        } catch (error: any) {
            // If related to "User not found" or 404/401/400, try Register
            const isAuthError = error.status === 404 || error.status === 401 || error.status === 400 || error.message?.includes('not found') || error.details?.message?.includes('not found');

            if (isAuthError) {
                const registerMessage = `Register for UPSx402`;
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
