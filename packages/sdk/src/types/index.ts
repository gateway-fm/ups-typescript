export interface UPSConfig {
    baseUrl: string;           // API base URL
    network: string;           // CAIP-2 format: "eip155:737998412"
    chainId?: number;          // Optional, parsed from network if not provided
    timeout?: number;          // Request timeout (default: 30000)
    retryAttempts?: number;    // Retry count (default: 3)
    refreshInterval?: number;  // Token refresh interval in ms (default: 60000 = 1 min)
}

// Authentication
export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    expiresAt: Date | null;
    address: string | null;
}

export interface AuthResult {
    token: string;
    expiresAt: string;
}

// User (from /auth/connect and /users/me)
export interface User {
    id: string;
    walletAddress: string;
    status: string;
    createdAt: string;
}

// Connect auth result (unified auth flow)
export interface ConnectResult {
    user: User;
    token: string;
    expiresAt: string;
    isNewUser: boolean;
}

// Wallet
export type EIP1193Provider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    chainId: number | null;
    provider: EIP1193Provider | null;
}

export interface ConnectedWallet {
    address: string;
    chainId: number;
    provider: EIP1193Provider;
}

// Account
export type AccountStatus = 'pending' | 'kyc_in_progress' | 'active' | 'frozen' | 'closed';

export interface Account {
    id: string;
    ownerAddress: string;
    walletAddress: string;
    status: AccountStatus;
    kycLevel: number;
    userId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateAccountParams {
    ownerAddress: string;
    salt: string;  // 0x-prefixed 32-byte hex
}

export interface CreateAccountResponse {
    account: Account;
    txHash: string;
}

// Payment (x402)
export interface PaymentRequirements {
    scheme: string;
    network: string;
    maxAmountRequired: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    resource?: string;
    description?: string;

    extra?: PaymentExtra;
    from?: string;
}

export enum PaymentType {
    UNSPECIFIED = 'UNSPECIFIED',
    DIRECT = 'DIRECT',
    ESCROW = 'ESCROW',
    INVOICE = 'INVOICE'
}

export interface PaymentExtra {
    name?: string;
    version?: string;
    payment_type?: PaymentType; // snake_case from API
    arbiter?: string;
    release_time?: number; // snake_case from API
    payee?: string; // intended recipient for escrow
    invoice_id?: string;
    invoice_payment_type?: 'DIRECT' | 'ESCROW';
}

export interface PaymentAuthorization {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;  // bytes32 hex
}

export interface SignedAuthorization extends PaymentAuthorization {
    signature: string;
}

export interface VerifyResponse {
    isValid: boolean;
    invalidReason?: string;
    payer?: string;
}

export interface SettleResponse {
    success: boolean;
    errorReason?: string;
    transaction?: string;
    network?: string;
    payer?: string;
}

// x402 Supported Schemes
export interface SupportedScheme {
    x402Version: number;
    scheme: string;
    network: string;
}

export interface SupportedSchemesResponse {
    kinds: SupportedScheme[];
    extensions?: string[];
    signers?: Record<string, string[]>;
}

// EIP-712 Typed Data
export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

export interface EIP712Type {
    name: string;
    type: string;
}

export interface EIP712TypedData {
    domain: EIP712Domain;
    types: Record<string, EIP712Type[]>;
    primaryType: string;
    message: Record<string, unknown>;
}

// Escrow
export interface Escrow {
    escrowId: string;
    payer: string;
    payee: string;
    amount: string;
    arbiter: string;
    releaseTime: number;
    status: EscrowStatus;
}

export type EscrowStatus = 'ACTIVE' | 'RELEASED' | 'REFUNDED';

export interface EscrowActionResponse {
    success: boolean;
    errorReason?: string;
    transaction?: string;
    network?: string;
}

// Invoices
export type InvoiceStatus = 'UNSPECIFIED' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface Invoice {
    invoice_id: string;
    merchant: string;
    payer: string;
    amount: string;
    paid_amount: string;
    due_date: number;
    created_at: number;
    payment_type: 'DIRECT' | 'ESCROW';
    status: InvoiceStatus;
    metadata_uri: string;
}

export interface CreateInvoiceRequest {
    merchant?: string;
    amount: string;
    payer?: string;
    due_date: number;
    payment_type: 'DIRECT' | 'ESCROW';
    metadata_uri: string;
}

export interface InvoiceResponse {
    invoice: Invoice;
}

export interface InvoiceListResponse {
    invoices: Invoice[];
    next_page_token: string;
}
