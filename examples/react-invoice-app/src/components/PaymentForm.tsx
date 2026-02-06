import { useState, useEffect, useRef } from 'react';
import { usePayment, useAccounts } from '@gatewayfm/ups-react';
import { parseUnits } from 'viem';
import type { Account } from '@gatewayfm/ups-sdk';
import { PAYMENT_TOKEN_ADDRESS } from '../context/TokenContext';
import { useBalances } from '../context/BalanceContext';

export function PaymentForm() {
    const { pay, isPending, error, data } = usePayment();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { balances, balancesLoading, triggerRefresh, decimals, symbol } = useBalances();

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('1'); // Human-readable amount (e.g., "1.5")

    // Track the last transaction hash we've seen to trigger balance refresh
    const lastTxHashRef = useRef<string | null>(null);

    // Get balance for selected account
    const selectedBalance = selectedAccount ? balances[selectedAccount.id] : null;

    // Auto-select first account when accounts load
    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount]);

    // Refresh balances after successful payment - using shared context
    useEffect(() => {
        if (data?.transaction && data.transaction !== lastTxHashRef.current) {
            console.log('[PaymentForm] Payment success detected, triggering shared balance refresh');
            lastTxHashRef.current = data.transaction;

            // Use the shared context to trigger refresh for ALL components
            triggerRefresh();
        }
    }, [data?.transaction, triggerRefresh]);

    // Convert human-readable amount to atomic units
    const getAtomicAmount = (): string => {
        try {
            const parsed = parseUnits(amount, decimals);
            return parsed.toString();
        } catch {
            return '0';
        }
    };

    // Validate amount input
    const isValidAmount = (): boolean => {
        try {
            const num = parseFloat(amount);
            return !isNaN(num) && num > 0;
        } catch {
            return false;
        }
    };

    const handlePay = () => {
        if (!selectedAccount || !isValidAmount()) return;

        const networkId = import.meta.env.VITE_NETWORK_ID || 'eip155:737998412';
        const atomicAmount = getAtomicAmount();

        const requirements = {
            scheme: 'exact',
            network: networkId,
            maxAmountRequired: atomicAmount,
            asset: PAYMENT_TOKEN_ADDRESS,
            payTo: recipient,
            maxTimeoutSeconds: 3600,
            extra: { name: 'x402 Payment Token', version: '1' }
        };

        pay({
            requirements,
            from: selectedAccount.walletAddress,
        });
    };

    // Handle amount input - allow only valid decimal numbers
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty, digits, and one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    // Manual refresh button handler
    const handleRefreshBalance = () => {
        triggerRefresh();
    };

    if (accountsLoading) {
        return <div className="card"><p>Loading accounts...</p></div>;
    }

    if (!accounts || accounts.length === 0) {
        return <div className="card"><p>No smart accounts found. Create one first.</p></div>;
    }

    if (data?.transaction) {
        return (
            <div className="card">
                <h3 style={{ color: '#22c55e' }}>✓ Payment Successful!</h3>
                <div style={{ margin: '16px 0', fontSize: '14px' }}>
                    <p style={{ margin: '8px 0' }}><strong>Amount:</strong> {amount} {symbol}</p>
                    <p style={{ margin: '8px 0' }}><strong>To:</strong> {recipient.slice(0, 10)}...{recipient.slice(-8)}</p>
                    <p style={{ margin: '8px 0', wordBreak: 'break-all' }}>
                        <strong>TX Hash:</strong> <code style={{ fontSize: '12px' }}>{data.transaction}</code>
                    </p>
                    {selectedAccount && (
                        <p style={{ margin: '8px 0' }}>
                            <strong>New Balance:</strong>{' '}
                            {balancesLoading ? (
                                <span style={{ color: '#888' }}>Updating...</span>
                            ) : (
                                <>
                                    {selectedBalance ?? 'N/A'} {symbol}
                                    <button
                                        onClick={handleRefreshBalance}
                                        style={{
                                            marginLeft: '8px',
                                            padding: '2px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ↻ Refresh
                                    </button>
                                </>
                            )}
                        </p>
                    )}
                </div>
                <button onClick={() => window.location.reload()}>Make Another Payment</button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Make Payment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
                <label style={{ textAlign: 'left', fontWeight: 'bold' }}>From Account:</label>
                <select
                    value={selectedAccount?.id || ''}
                    onChange={(e) => {
                        const account = accounts.find((a: Account) => a.id === e.target.value);
                        setSelectedAccount(account || null);
                    }}
                    style={{ padding: '8px' }}
                >
                    {accounts.map((account: Account) => (
                        <option key={account.id} value={account.id}>
                            {account.walletAddress.slice(0, 10)}...{account.walletAddress.slice(-8)}
                            {balances[account.id] ? ` | ${balances[account.id]} ${symbol}` : ''}
                        </option>
                    ))}
                </select>
                {selectedAccount && (
                    <div style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                        <p style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                            Address: {selectedAccount.walletAddress}
                        </p>
                        <p style={{ margin: '4px 0', fontWeight: 'bold', color: '#333' }}>
                            Balance: {balancesLoading ? 'Loading...' : `${selectedBalance ?? 'N/A'} ${symbol}`}
                            <button
                                onClick={handleRefreshBalance}
                                style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                                disabled={balancesLoading}
                            >
                                ↻
                            </button>
                        </p>
                    </div>
                )}
                <input
                    placeholder="Recipient Address (0x...)"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    style={{ padding: '8px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder={`Amount (${symbol})`}
                        value={amount}
                        onChange={handleAmountChange}
                        style={{ padding: '8px', flex: 1 }}
                    />
                    <span style={{ fontWeight: 'bold', minWidth: '50px' }}>{symbol}</span>
                </div>
                {amount && isValidAmount() && (
                    <div style={{ fontSize: '11px', color: '#888' }}>
                        = {getAtomicAmount()} atomic units
                    </div>
                )}
                <button
                    onClick={handlePay}
                    disabled={isPending || !recipient || !selectedAccount || !isValidAmount()}
                >
                    {isPending ? 'Processing...' : `Pay ${amount || '0'} ${symbol}`}
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        </div>
    );
}
