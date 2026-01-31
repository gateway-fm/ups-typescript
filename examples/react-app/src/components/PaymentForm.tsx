import { useState } from 'react';
import { usePayment, useCurrentAccount } from '@x402-ups/react';

export function PaymentForm() {
    const { pay, isPending, error, data } = usePayment();
    const currentAccount = useCurrentAccount();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('1000000'); // 1 USDC (6 decimals) default

    const handlePay = () => {
        if (!currentAccount) return;

        // This is a simplified payment requirement
        const requirements = {
            scheme: 'exact',
            network: 'eip155:84532',
            maxAmountRequired: amount,
            asset: '0x...', // Should be replaced with actual token address or from env
            payTo: recipient,
            maxTimeoutSeconds: 3600,
            extra: { name: 'Demo Payment', version: '1' }
        };

        pay({
            requirements,
            from: currentAccount.walletAddress,
        });
    };

    if (!currentAccount) return null;

    if (data?.txHash) {
        return (
            <div className="card">
                <h3>Payment Successful!</h3>
                <p>TX Hash: {data?.txHash}</p>
                <button onClick={() => window.location.reload()}>New Payment</button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Make Payment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                <input
                    placeholder="Recipient Address (0x...)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    style={{ padding: '8px' }}
                />
                <input
                    placeholder="Amount (Atomic Units)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ padding: '8px' }}
                />
                <button onClick={handlePay} disabled={isPending || !recipient}>
                    {isPending ? 'Processing...' : 'Pay'}
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        </div>
    );
}
