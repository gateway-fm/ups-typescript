import { useState, useEffect } from 'react';
import { createWalletClient, custom, type WalletClient, type EIP1193Provider } from 'viem';
import { useUPSClient } from '@x402-ups/react';

export function WalletConnect() {
    const client = useUPSClient();
    const [address, setAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            setAddress(addr);

            // Connect to UPS SDK
            await client.connect(ethereum);

        } catch (err: any) {
            setError(err.message);
        }
    };

    if (address) {
        return (
            <div className="card">
                <h3>Connected Wallet</h3>
                <p>{address}</p>
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
