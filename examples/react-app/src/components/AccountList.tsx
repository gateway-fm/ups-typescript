import { useState } from 'react';
import { useAccounts, useWallet } from '@gateway-fm/react';
import { createWalletClient, custom, parseUnits, type EIP1193Provider } from 'viem';
import type { Account } from '@gateway-fm/sdk';
import { PAYMENT_TOKEN_ADDRESS, ERC20_ABI, RPC_URL, CHAIN_ID } from '../context/TokenContext';
import { useBalances } from '../context/BalanceContext';

export function AccountList() {
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { address: rootAddress } = useWallet();
    const { balances, balancesLoading, fetchBalances, symbol, decimals } = useBalances();

    const [fundingAccountId, setFundingAccountId] = useState<string | null>(null);
    const [fundAmount, setFundAmount] = useState<string>('10');
    const [fundingInProgress, setFundingInProgress] = useState(false);
    const [fundError, setFundError] = useState<string | null>(null);
    const [fundSuccess, setFundSuccess] = useState<string | null>(null);

    const handleFund = async (account: Account) => {
        if (!rootAddress) {
            setFundError('Wallet not connected');
            return;
        }

        setFundingInProgress(true);
        setFundError(null);
        setFundSuccess(null);

        try {
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                throw new Error('MetaMask not found');
            }

            const walletClient = createWalletClient({
                transport: custom(ethereum as EIP1193Provider),
            });

            const amount = parseUnits(fundAmount, decimals);

            const hash = await walletClient.writeContract({
                address: PAYMENT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [account.walletAddress as `0x${string}`, amount],
                account: rootAddress as `0x${string}`,
                chain: { id: CHAIN_ID, name: 'TAU', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
            });

            setFundSuccess(`Transaction sent: ${hash}`);
            setFundingAccountId(null);

            // Refresh balances after funding
            setTimeout(() => fetchBalances(), 3000);

        } catch (err: any) {
            setFundError(err.message || 'Failed to fund account');
        } finally {
            setFundingInProgress(false);
        }
    };

    if (accountsLoading) {
        return <div className="card"><p>Loading accounts...</p></div>;
    }

    if (!accounts || accounts.length === 0) {
        return null;
    }

    return (
        <div className="card">
            <h3>Smart Accounts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {accounts.map((account) => (
                    <div key={account.id} style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <p style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', margin: '4px 0' }}>
                            {account.walletAddress}
                        </p>
                        <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                            Balance: {balancesLoading ? 'Loading...' : `${balances[account.id] ?? 'N/A'} ${symbol}`}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                            Status: {account.status}
                        </p>

                        {fundingAccountId === account.id ? (
                            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    style={{ padding: '6px', width: '80px' }}
                                />
                                <span>{symbol}</span>
                                <button
                                    onClick={() => handleFund(account)}
                                    disabled={fundingInProgress}
                                    style={{ backgroundColor: '#28a745', color: 'white' }}
                                >
                                    {fundingInProgress ? 'Sending...' : 'Send'}
                                </button>
                                <button
                                    onClick={() => setFundingAccountId(null)}
                                    style={{ backgroundColor: '#6c757d', color: 'white' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setFundingAccountId(account.id)}
                                style={{ marginTop: '8px', backgroundColor: '#007bff', color: 'white' }}
                            >
                                Fund Account
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {fundError && <p style={{ color: 'red', marginTop: '10px' }}>{fundError}</p>}
            {fundSuccess && <p style={{ color: 'green', marginTop: '10px' }}>{fundSuccess}</p>}

            <button
                onClick={fetchBalances}
                disabled={balancesLoading}
                style={{ marginTop: '15px', backgroundColor: '#6c757d', color: 'white' }}
            >
                {balancesLoading ? 'Refreshing...' : 'Refresh Balances'}
            </button>
        </div>
    );
}
