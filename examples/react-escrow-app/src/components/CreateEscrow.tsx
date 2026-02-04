import { useState, useEffect } from 'react';
import { usePayment, useAccounts } from '@gatewayfm/ups-react';
import { parseUnits, decodeEventLog } from 'viem';
import { Account, PaymentType } from '@gatewayfm/ups-sdk';
import { PAYMENT_TOKEN_ADDRESS, publicClient } from '../context/TokenContext';
import { useBalances } from '../context/BalanceContext';

// Minimal ABI for EscrowCreated event
const ESCROW_EVENT_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'escrowId', type: 'bytes32' },
            { indexed: true, name: 'payer', type: 'address' },
            { indexed: true, name: 'payee', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
            { indexed: false, name: 'arbiter', type: 'address' }
        ],
        name: 'EscrowCreated',
        type: 'event',
    }
] as const;

export function CreateEscrow() {
    const { pay, isPending, error, data } = usePayment();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { balances, balancesLoading, triggerRefresh, decimals, symbol } = useBalances();

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [recipient, setRecipient] = useState('');
    const [arbiter, setArbiter] = useState('');
    const [amount, setAmount] = useState('1');
    const [releaseDelay, setReleaseDelay] = useState('3600'); // Seconds
    const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null);

    const selectedBalance = selectedAccount ? balances[selectedAccount.id] : null;

    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount]);

    // Parse logs when transaction succeeds
    useEffect(() => {
        if (data?.transaction) {
            triggerRefresh(); // Refresh balances

            // Fetch receipt to get logs
            const fetchReceipt = async () => {
                try {
                    const receipt = await publicClient.waitForTransactionReceipt({
                        hash: data.transaction as `0x${string}`
                    });

                    for (const log of receipt.logs) {
                        try {
                            const decoded = decodeEventLog({
                                abi: ESCROW_EVENT_ABI,
                                data: log.data,
                                topics: log.topics,
                            });

                            if (decoded.eventName === 'EscrowCreated') {
                                setCreatedEscrowId(decoded.args.escrowId);
                                break;
                            }
                        } catch {
                            // Ignore logs that don't match our ABI
                            continue;
                        }
                    }
                } catch (err) {
                    console.error('Failed to parse logs:', err);
                }
            };
            fetchReceipt();
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
        setCreatedEscrowId(null); // Reset previous ID

        const networkId = import.meta.env.VITE_NETWORK_ID || 'eip155:737998412';
        const atomicAmount = getAtomicAmount();
        const releaseTime = Math.floor(Date.now() / 1000) + parseInt(releaseDelay);

        // Escrow Contract on TAU Testnet (from error message)
        const ESCROW_CONTRACT_ADDRESS = '0xcc5b2cef495510EbC98ce41600C81CaF67B791E1';

        const requirements = {
            scheme: 'exact',
            network: networkId,
            maxAmountRequired: atomicAmount,
            asset: PAYMENT_TOKEN_ADDRESS,
            payTo: ESCROW_CONTRACT_ADDRESS, // Must pay to the Escrow Contract
            maxTimeoutSeconds: 3600,
            extra: {
                name: 'x402 Payment Token',
                version: '1',
                payment_type: PaymentType.ESCROW,
                arbiter: arbiter || undefined,
                release_time: releaseTime,
                payee: recipient // The ultimate beneficiary
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
                <p><strong>Escrow ID:</strong> <code>{createdEscrowId || 'Fetching from logs...'}</code></p>
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
