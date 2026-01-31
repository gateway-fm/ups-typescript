import { useState } from 'react';
import { useCreateAccount, useAuth, useUPSClient } from '@x402-ups/react';
import { bytesToHex } from 'viem';

export function AccountCreation() {
    const client = useUPSClient();
    const { createAccount, isPending, error, data } = useCreateAccount();
    const { isAuthenticated, authenticate } = useAuth();

    const handleCreate = async () => {
        if (!isAuthenticated) {
            await authenticate.mutateAsync();
        }

        const salt = new Uint8Array(32);
        crypto.getRandomValues(salt);

        // Assumes wallet is already connected via client.connect() in WalletConnect
        const owner = client.wallet.getAddress();

        if (!owner) {
            alert("Wallet not connected");
            return;
        }

        createAccount({
            ownerAddress: owner,
            salt: bytesToHex(salt),
        });
    };

    if (data?.account) {
        return (
            <div className="card">
                <h3>Account Created!</h3>
                <p>Address: <span style={{ fontFamily: 'monospace' }}>{data.account.walletAddress}</span></p>
                <p>TX Hash: <a href={`https://sepolia.basescan.org/tx/${data.txHash}`} target="_blank" rel="noreferrer">View on Etherscan</a></p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Create Smart Account</h3>
            {!isAuthenticated && <p>Authentication required first</p>}
            <button onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Creating...' : isAuthenticated ? 'Create Account' : 'Authenticate & Create'}
            </button>
            {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        </div>
    );
}
