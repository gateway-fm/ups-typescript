import { useState, useEffect } from 'react';
import { createWalletClient, custom, formatUnits, type EIP1193Provider } from 'viem';
import { useUPSClient, useWallet } from '@x402-ups/react';
import { useToken, publicClient, PAYMENT_TOKEN_ADDRESS, ERC20_ABI } from '../context/TokenContext';

export function WalletConnect() {
    const client = useUPSClient();
    const { isConnected, address } = useWallet();
    const { decimals, symbol, formatBalance } = useToken();
    const [error, setError] = useState<string | null>(null);
    const [localAddress, setLocalAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const displayAddress = address || localAddress;

    // Fetch token balance when address changes
    useEffect(() => {
        if (!displayAddress) {
            setBalance(null);
            return;
        }

        setBalanceLoading(true);
        publicClient
            .readContract({
                address: PAYMENT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [displayAddress as `0x${string}`],
            })
            .then((result) => {
                setBalance(formatBalance(formatUnits(result, decimals)));
            })
            .catch((err) => {
                console.error('Failed to fetch balance:', err);
                setBalance('Error');
            })
            .finally(() => setBalanceLoading(false));
    }, [displayAddress, decimals, formatBalance]);

    const connect = async () => {
        try {
            const ethereum = (window as any).ethereum;
            if (!ethereum) {
                throw new Error('No crypto wallet found. Please install MetaMask.');
            }

            await ethereum.request({ method: 'eth_requestAccounts' });

            const walletClient = createWalletClient({
                transport: custom(ethereum as EIP1193Provider)
            });

            const [addr] = await walletClient.getAddresses();
            setLocalAddress(addr);

            // Connect to UPS SDK
            await client.connect(ethereum);

        } catch (err: any) {
            setError(err.message);
        }
    };

    const disconnect = async () => {
        try {
            await client.disconnect();
            setLocalAddress(null);
            setBalance(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isConnected || displayAddress) {
        return (
            <div className="card">
                <h3>Connected Wallet</h3>
                <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', margin: '8px 0' }}>
                    {displayAddress}
                </p>
                <p style={{ fontWeight: 'bold', color: '#28a745', margin: '8px 0' }}>
                    Balance: {balanceLoading ? 'Loading...' : `${balance ?? 'N/A'} ${symbol}`}
                </p>
                <button onClick={disconnect} style={{ marginTop: '10px', backgroundColor: '#dc3545', color: 'white' }}>
                    Disconnect MetaMask
                </button>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>Connect Wallet</h3>
            <button onClick={connect}>Connect MetaMask</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
