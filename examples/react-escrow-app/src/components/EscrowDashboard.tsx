import { useState } from 'react';
import { useUPSClient, useWallet } from '@gateway-fm/ups-react';
import { Escrow } from '@gateway-fm/ups-sdk';

export function EscrowDashboard() {
    const client = useUPSClient();
    const { isConnected } = useWallet();

    const [escrowId, setEscrowId] = useState('');
    const [escrow, setEscrow] = useState<Escrow | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const fetchEscrow = async () => {
        if (!escrowId) return;
        setLoading(true);
        setError(null);
        setEscrow(null);
        try {
            const data = await client.escrow.get(escrowId);
            setEscrow(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch escrow');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'release' | 'refund') => {
        if (!escrow) return;
        setLoading(true);
        setActionMsg(null);
        setError(null);
        try {
            // Network fallback if not on escrow, though getEscrow doesn't return network directly usually? 
            // The release/refund API requires network. We might assume same network as client config or user input.
            // Simplified: use client config network or hardcoded for demo.
            const network = client.config.network;

            if (action === 'release') {
                await client.escrow.release(escrow.escrowId, network);
                setActionMsg('Funds Released!');
            } else {
                await client.escrow.refund(escrow.escrowId, network);
                setActionMsg('Funds Refunded!');
            }
            // Refresh details
            fetchEscrow();
        } catch (err: any) {
            setError(err.message || `Failed to ${action}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) return null;

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <h3>Manage Escrow</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
                <input
                    placeholder="Enter Escrow ID"
                    value={escrowId}
                    onChange={e => setEscrowId(e.target.value)}
                    style={{ padding: '8px', width: '300px' }}
                />
                <button onClick={fetchEscrow} disabled={loading || !escrowId}>
                    {loading ? '...' : 'Lookup'}
                </button>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {actionMsg && <p style={{ color: 'green' }}>{actionMsg}</p>}

            {escrow && (
                <div style={{ textAlign: 'left', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', maxWidth: '500px', margin: '0 auto' }}>
                    <p><strong>ID:</strong> {escrow.escrowId}</p>
                    <p><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: escrow.status === 'ACTIVE' ? 'blue' : 'gray' }}>{escrow.status}</span></p>
                    <p><strong>Amount:</strong> {escrow.amount}</p>
                    <p><strong>Payer:</strong> {escrow.payer}</p>
                    <p><strong>Payee:</strong> {escrow.payee}</p>
                    <p><strong>Arbiter:</strong> {escrow.arbiter}</p>
                    <p><strong>Release Time:</strong> {new Date(escrow.releaseTime * 1000).toLocaleString()}</p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                            onClick={() => handleAction('release')}
                            disabled={loading || escrow.status !== 'ACTIVE'}
                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                        >
                            Release
                        </button>
                        <button
                            onClick={() => handleAction('refund')}
                            disabled={loading || escrow.status !== 'ACTIVE'}
                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                        >
                            Refund
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
