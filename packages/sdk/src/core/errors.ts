export class UPSError extends Error {
    code: string;
    details?: unknown;

    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = 'UPSError';
        this.code = code;
        this.details = details;
    }
}

export class NetworkError extends UPSError {
    public status?: number;

    constructor(message: string, details?: unknown, status?: number) {
        super(message, 'NETWORK_ERROR', details);
        this.name = 'NetworkError';
        this.status = status;
    }
}

export class AuthError extends UPSError {
    constructor(message: string, details?: unknown) {
        super(message, 'AUTH_ERROR', details);
        this.name = 'AuthError';
    }
}

export class WalletError extends UPSError {
    constructor(message: string, details?: unknown) {
        super(message, 'WALLET_ERROR', details);
        this.name = 'WalletError';
    }
}

export class PaymentError extends UPSError {
    constructor(message: string, details?: unknown) {
        super(message, 'PAYMENT_ERROR', details);
        this.name = 'PaymentError';
    }
}

export class RateLimitError extends UPSError {
    constructor(message: string, details?: unknown) {
        super(message, 'RATE_LIMIT_ERROR', details);
        this.name = 'RateLimitError';
    }
}
