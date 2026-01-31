
// Provider
export { UPSProvider, useUPSContext, useUPSClient } from './provider';

// Store
export { useUPSStore } from './store';

// Hooks
export { useWallet, useConnect, useDisconnect } from './hooks/use-wallet';
export { useAuth } from './hooks/use-auth';
export {
    useAccounts,
    useAccount,
    useAccountByWallet,
    usePredictAddress,
    useCreateAccount,
    useCurrentAccount,
    generateSalt,
} from './hooks/use-account';
export { usePayment, usePaymentVerify, usePaymentSettle } from './hooks/use-payment';

// Re-export types from SDK
export type { UPSConfig, Account, PaymentRequirements, SettleResponse as PaymentResult } from '@x402-ups/sdk';
