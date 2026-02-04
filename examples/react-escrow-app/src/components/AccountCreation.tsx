import { useState } from 'react';
import { useCreateAccount, useAuth, useUPSClient, useAccounts } from '@gatewayfm/ups-react';
import { bytesToHex } from 'viem';

export function AccountCreation() {
    const client = useUPSClient();
    const { createAccount, isPending: createPending, error: createError, reset } = useCreateAccount();
    const { refetch: refetchAccounts } = useAccounts();
    const { isAuthenticated, authenticate } = useAuth();
    const [authError, setAuthError] = useState<string | null>(null);
    const [lastCreated, setLastCreated] = useState<{ address: string; txHash: string } | null>(null);
    const [createLocalError, setCreateLocalError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleAuthenticate = async () => {
        try {
            setAuthError(null);
            await authenticate.mutateAsync();
        } catch (err: any) {
            setAuthError(err.message || 'Authentication failed');
        }
    };

    const handleCreate = async () => {
        console.log('=== Create New Account button clicked ===');

        // Generate a unique random salt for each new account
        const salt = new Uint8Array(32);
        crypto.getRandomValues(salt);
        const saltHex = bytesToHex(salt);

        const owner = client.wallet.getAddress();
        console.log('Owner address:', owner);
        console.log('Salt:', saltHex);

        if (!owner) {
            setCreateLocalError("Wallet not connected");
            return;
        }

        // Reset any previous state
        reset();
        setCreateLocalError(null);
        setIsCreating(true);

        try {
            console.log('Calling createAccount API...');
            const result = await createAccount({
                ownerAddress: owner,
                salt: saltHex,
            });
            console.log('API response:', result);

            if (result?.account) {
                setLastCreated({
                    address: result.account.walletAddress,
                    txHash: result.txHash || '',
                });
                console.log('Account created successfully, refetching accounts...');
                // Refetch accounts list to show the new account
                await refetchAccounts();
                console.log('Accounts refetched');
            } else {
                console.log('No account in response:', result);
                setCreateLocalError('No account returned from server');
            }
        } catch (err: any) {
            console.error('Failed to create account:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            setCreateLocalError(err.message || 'Failed to create account');
        } finally {
            setIsCreating(false);
        }
    };

    // Not authenticated - show authenticate button
    if (!isAuthenticated) {
        return (
            <div className="card">
                <h3>Authentication</h3>
                <p>Please authenticate to access features.</p>
                <button onClick={handleAuthenticate} disabled={authenticate.isPending}>
                    {authenticate.isPending ? 'Authenticating...' : 'Authenticate'}
                </button>
                {authError && <p style={{ color: 'red' }}>Error: {authError}</p>}
            </div>
        );
    }

    const isDisabled = createPending || isCreating;

    // Authenticated - show create account button
    return (
        <div className="card">
            <h3>Create Smart Account</h3>

            {lastCreated && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
                    <p style={{ margin: '4px 0', color: '#155724' }}>✓ Account Created!</p>
                    <p style={{ margin: '4px 0', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {lastCreated.address}
                    </p>
                    {lastCreated.txHash && (
                        <a
                            href={`https://explorer.tau.gateway.fm/tx/${lastCreated.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '12px' }}
                        >
                            View on Explorer
                        </a>
                    )}
                </div>
            )}

            <button
                onClick={handleCreate}
                disabled={isDisabled}
                style={isDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
                {isDisabled ? 'Creating... (please wait)' : 'Create New Account'}
            </button>

            {(createError || createLocalError) && (
                <p style={{ color: 'red', marginTop: '10px' }}>
                    Error: {createError?.message || createLocalError}
                </p>
            )}

            <p style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                Check browser console (F12) for detailed logs
            </p>
        </div>
    );
}
