import { useMutation } from '@tanstack/react-query';
import {
    type PaymentRequirements,
    type SignedAuthorization,
    type VerifyResponse,
    type SettleResponse
} from '@gateway-fm/ups-sdk';
import { useUPSClient } from '../provider';

export interface UsePaymentParams {
    requirements: PaymentRequirements;
    from: string;  // Payer SmartAccount address
}

// PaymentResult is SettleResponse from SDK type
export interface UsePaymentReturn {
    pay: (params: UsePaymentParams) => Promise<SettleResponse>;
    isPending: boolean;
    error: Error | null;
    data: SettleResponse | undefined;
    reset: () => void;
}

export function usePayment(): UsePaymentReturn {
    const client = useUPSClient();

    // client.payment.pay takes { requirements, from }
    const mutation = useMutation({
        mutationFn: (params: UsePaymentParams) => client.payment.pay({
            requirements: params.requirements,
            from: params.from
        }),
    });

    return {
        pay: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
}

export interface UsePaymentVerifyReturn {
    verify: (signed: SignedAuthorization, requirements: PaymentRequirements) => Promise<VerifyResponse>;
    isPending: boolean;
    error: Error | null;
}

export function usePaymentVerify(): UsePaymentVerifyReturn {
    const client = useUPSClient();

    const mutation = useMutation({
        mutationFn: (params: { signed: SignedAuthorization, requirements: PaymentRequirements }) =>
            client.payment.verify(params.signed, params.requirements),
    });

    return {
        verify: (signed, requirements) => mutation.mutateAsync({ signed, requirements }),
        isPending: mutation.isPending,
        error: mutation.error,
    };
}

export interface UsePaymentSettleReturn {
    settle: (signed: SignedAuthorization, requirements: PaymentRequirements) => Promise<SettleResponse>;
    isPending: boolean;
    error: Error | null;
}

export function usePaymentSettle(): UsePaymentSettleReturn {
    const client = useUPSClient();

    const mutation = useMutation({
        mutationFn: (params: { signed: SignedAuthorization, requirements: PaymentRequirements }) =>
            client.payment.settle(params.signed, params.requirements),
    });

    return {
        settle: (signed, requirements) => mutation.mutateAsync({ signed, requirements }),
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
