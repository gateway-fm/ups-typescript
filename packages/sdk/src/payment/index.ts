import { HttpClient } from '../core/http-client';
import { WalletModule } from '../wallet';
import {
    PaymentRequirements,
    PaymentAuthorization,
    SignedAuthorization,
    VerifyResponse,
    SettleResponse,
    SupportedSchemesResponse,
    EIP712TypedData,
    Invoice,
    PaymentType
} from '../types';
import { PaymentError } from '../core/errors';

export class PaymentModule {
    constructor(
        private http: HttpClient,
        private wallet: WalletModule
    ) { }

    async pay(request: { requirements: PaymentRequirements; from?: string }): Promise<SettleResponse> {
        const from = request.from || request.requirements.from || this.wallet.getAddress();
        if (!from) throw new PaymentError('No sender address provided');

        // Create requirements with `from` set for EIP-1271 Smart Account signature verification
        const requirementsWithFrom: PaymentRequirements = {
            ...request.requirements,
            from,  // Critical: backend needs to know which Smart Account is the payer
        };

        const auth = this.buildAuthorization(requirementsWithFrom, from);
        const signed = await this.signAuthorization(auth, requirementsWithFrom);

        const verification = await this.verify(signed, requirementsWithFrom);
        if (!verification.isValid) {
            throw new PaymentError(`Payment verification failed: ${verification.invalidReason}`);
        }

        return this.settle(signed, requirementsWithFrom);
    }

    /**
     * Pay an invoice
     * @param invoice The invoice to pay
     * @param params Payment parameters (amount, asset, network)
     */
    async payInvoice(invoice: Invoice, params: {
        amount: string; // Atomic units
        asset: string;
        network: string;
        payTo?: string; // Defaults to invoice.merchant
        from?: string;  // Payer Smart Account address
    }): Promise<SettleResponse> {
        const payTo = params.payTo || invoice.merchant;
        if (!payTo) throw new PaymentError('No payee address (merchant) available for invoice');

        const requirements: PaymentRequirements = {
            scheme: 'exact',
            network: params.network,
            maxAmountRequired: params.amount,
            asset: params.asset,
            payTo,
            maxTimeoutSeconds: 3600,
            extra: {
                name: 'x402 Payment Token',
                version: '1',
                payment_type: PaymentType.INVOICE,
                invoice_id: invoice.invoice_id,
                invoice_payment_type: invoice.payment_type
            }
        };

        return this.pay({
            requirements,
            from: params.from
        });
    }

    buildAuthorization(requirements: PaymentRequirements, from: string): PaymentAuthorization {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const nonce = '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

        const now = Math.floor(Date.now() / 1000);

        return {
            from,
            to: requirements.payTo,
            value: requirements.maxAmountRequired,
            validAfter: now - 60, // 60s buffer
            validBefore: now + requirements.maxTimeoutSeconds,
            nonce
        };
    }

    async signAuthorization(authorization: PaymentAuthorization, requirements: PaymentRequirements): Promise<SignedAuthorization> {
        let chainId: number;
        const network = requirements.network;
        if (network.startsWith('eip155:')) {
            chainId = parseInt(network.split(':')[1], 10);
        } else {
            chainId = parseInt(network, 10);
        }

        if (isNaN(chainId)) throw new PaymentError('Invalid chain ID');

        // EIP-712 requires uint256 values as BigInt for proper encoding
        const typedData: EIP712TypedData = {
            domain: {
                name: requirements.extra?.name || "x402 Payment Token",
                version: requirements.extra?.version || "1",
                chainId,
                verifyingContract: requirements.asset
            },
            types: {
                TransferWithAuthorization: [
                    { name: "from", type: "address" },
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" },
                    { name: "nonce", type: "bytes32" }
                ]
            },
            primaryType: "TransferWithAuthorization",
            message: {
                from: authorization.from,
                to: authorization.to,
                // CRITICAL: viem requires BigInt for uint256 types
                value: BigInt(authorization.value),
                validAfter: BigInt(authorization.validAfter),
                validBefore: BigInt(authorization.validBefore),
                nonce: authorization.nonce
            }
        };

        const signature = await this.wallet.signTypedData(typedData);
        return { ...authorization, signature };
    }

    encodePaymentHeader(signed: SignedAuthorization, requirements: PaymentRequirements): string {
        const authorization = {
            from: signed.from,
            to: signed.to,
            value: signed.value,
            nonce: signed.nonce,
            validAfter: signed.validAfter.toString(),
            validBefore: signed.validBefore.toString(),
        };

        const accepted = {
            scheme: requirements.scheme,
            network: requirements.network,
            amount: requirements.maxAmountRequired,
            asset: requirements.asset,
            payTo: requirements.payTo,
            maxTimeoutSeconds: requirements.maxTimeoutSeconds,
        };

        const paymentPayload = {
            x402Version: 1,
            accepted,
            payload: {
                authorization,
                signature: signed.signature,
            },
        };

        const jsonStr = JSON.stringify(paymentPayload);
        const b64Str = btoa(jsonStr);
        return `x402 ${b64Str}`;
    }

    async verify(signed: SignedAuthorization, requirements: PaymentRequirements): Promise<VerifyResponse> {
        const header = this.encodePaymentHeader(signed, requirements);
        const response = await this.http.post<VerifyResponse>('/x402/verify', {
            x402Version: 1,
            paymentHeader: header,
            paymentRequirements: requirements
        }, { skipAuth: true });

        // Normalize response: if invalidReason is present, consider it invalid
        if (response.invalidReason && response.isValid === undefined) {
            response.isValid = false;
        }

        return response;
    }

    async settle(signed: SignedAuthorization, requirements: PaymentRequirements): Promise<SettleResponse> {
        const header = this.encodePaymentHeader(signed, requirements);
        const response = await this.http.post<SettleResponse>('/x402/settle', {
            x402Version: 1,
            paymentHeader: header,
            paymentRequirements: requirements
        }, { skipAuth: true });

        if (response.success === false || response.errorReason) {
            throw new PaymentError(response.errorReason || 'Payment settlement failed');
        }

        return response;
    }

    /**
     * Get supported payment schemes from the facilitator.
     * This endpoint does not require authentication.
     */
    async getSupportedSchemes(): Promise<SupportedSchemesResponse> {
        return this.http.get<SupportedSchemesResponse>('/x402/supported', { skipAuth: true });
    }
}
