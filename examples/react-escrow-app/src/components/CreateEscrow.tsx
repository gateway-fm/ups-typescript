import { useState, useEffect } from 'react';
import { usePayment, useAccounts } from '@gateway-fm/ups-react';
import { parseUnits } from 'viem';
import { Account, PaymentType } from '@gateway-fm/ups-sdk';
import { PAYMENT_TOKEN_ADDRESS } from '../context/TokenContext';
import { useBalances } from '../context/BalanceContext';

export function CreateEscrow() {
    const { pay, isPending, error, data } = usePayment();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { balances, balancesLoading, triggerRefresh, decimals, symbol } = useBalances();

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [recipient, setRecipient] = useState('');
    const [arbiter, setArbiter] = useState('');
    const [amount, setAmount] = useState('1');
    const [releaseDelay, setReleaseDelay] = useState('3600'); // Seconds

    const selectedBalance = selectedAccount ? balances[selectedAccount.id] : null;

    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount]);

    // Simple auto-refresh trigger when payment succeeds (transaction hash available)
    useEffect(() => {
        if (data?.transaction) {
            triggerRefresh();
        }
    }, [data?.transaction, triggerRefresh]);

    const getAtomicAmount = (): string => {
        try {
            return parseUnits(amount, decimals).toString();
        } catch {
            return '0';
        }
    };

    const isValidAmount = (): boolean => {
        try {
            const num = parseFloat(amount);
            return !isNaN(num) && num > 0;
        } catch {
            return false;
        }
    };

    const handleCreate = () => {
        if (!selectedAccount || !isValidAmount()) return;

        const networkId = import.meta.env.VITE_NETWORK_ID || 'eip155:737998412';
        const atomicAmount = getAtomicAmount();
        const releaseTime = Math.floor(Date.now() / 1000) + parseInt(releaseDelay);

        const requirements = {
            scheme: 'exact',
            network: networkId,
            maxAmountRequired: atomicAmount,
            asset: PAYMENT_TOKEN_ADDRESS,
            payTo: recipient,
            maxTimeoutSeconds: 3600,
            extra: {
                name: 'x402 Payment Token',
                version: '1',
                payment_type: PaymentType.ESCROW,
                arbiter: arbiter || undefined, // Optional if backend has default? Or required?
                release_time: releaseTime
            }
        };

        pay({
            requirements,
            from: selectedAccount.walletAddress,
        });
    };

    if (accountsLoading) return <div className="card"><p>Loading accounts...</p></div>;
    if (!accounts?.length) return <div className="card"><p>No smart accounts found.</p></div>;

    if (data?.transaction) {
        return (
            <div className="card">
                <h3 style={{ color: '#22c55e' }}>✓ Escrow Created!</h3>
                <p><strong>TX:</strong> <code>{data.transaction}</code></p>
                <p><strong>Amount:</strong> {amount} {symbol}</p>
                <p><strong>Payee:</strong> {recipient}</p>
                <p><strong>Arbiter:</strong> {arbiter || 'Default'}</p>
                <button onClick={() => window.location.reload()}>Create Another</button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Create Escrow Payment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                <label style={{ fontWeight: 'bold' }}>From Account</label>
                <select
                    value={selectedAccount?.id || ''}
                    onChange={e => setSelectedAccount(accounts.find((a: Account) => a.id === e.target.value) || null)}
                    style={{ padding: '8px' }}
                >
                    {accounts.map((a: Account) => (
                        <option key={a.id} value={a.id}>{a.walletAddress} ({balances[a.id] || 0} {symbol})</option>
                    ))}
                </select>

                <input placeholder="Payee Address (0x...)" value={recipient} onChange={e => setRecipient(e.target.value)} style={{ padding: '8px' }} />
                <input placeholder="Arbiter Address (0x...) - Optional" value={arbiter} onChange={e => setArbiter(e.target.value)} style={{ padding: '8px' }} />

                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: '8px', flex: 1 }} />
                    <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>{symbol}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label>Release Delay (s):</label>
                    <input type="number" value={releaseDelay} onChange={e => setReleaseDelay(e.target.value)} style={{ padding: '8px', width: '80px' }} />
                </div>

                <button onClick={handleCreate} disabled={isPending || !recipient || !isValidAmount()}>
                    {isPending ? 'Creating...' : 'Create Escrow'}
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error.message}</p>}
        </div>
    );
}
