import { useAccounts, useCurrentAccount } from '@gateway-fm/ups-react';
import type { Account } from '@gateway-fm/ups-sdk';

export function AccountInfo() {
    const { data: accounts, isLoading } = useAccounts();
    const currentAccount = useCurrentAccount();

    if (isLoading) return <div>Loading accounts...</div>;

    if (!accounts || accounts.length === 0) {
        return <div className="card">No Smart Accounts found. Create one!</div>;
    }

    return (
        <div className="card">
            <h3>Your Smart Accounts</h3>
            <ul>
                {accounts.map((acc: Account) => (
                    <li key={acc.walletAddress} style={{
                        fontWeight: currentAccount?.walletAddress === acc.walletAddress ? 'bold' : 'normal',
                        textAlign: 'left'
                    }}>
                        {acc.walletAddress}
                    </li>
                ))}
            </ul>
        </div>
    );
}
