import { useState, useEffect } from 'react';
import { useInvoices, useCancelInvoice, useAccounts, usePayInvoice } from '@gatewayfm/ups-react';
import { Invoice, Account } from '@gatewayfm/ups-sdk';
import { formatUnits } from 'viem';
import { PAYMENT_TOKEN_ADDRESS } from '../context/TokenContext';
import { useBalances } from '../context/BalanceContext';

export const InvoiceDashboard = () => {
    const { data: accounts } = useAccounts();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [role, setRole] = useState<'merchant' | 'payer'>('merchant');

    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    const selectedAccount = accounts?.find((a: Account) => a.id === selectedAccountId);

    const params = selectedAccount ? {
        [role]: selectedAccount.walletAddress
    } : undefined;

    // Only fetch if we have a selected account to avoid 400 error
    const { data: invoices, isPending, error, refetch } = useInvoices(params);
    const { cancelInvoice } = useCancelInvoice();
    const { payInvoice, isPending: isPaying, data: paymentData } = usePayInvoice();
    const { decimals } = useBalances();

    useEffect(() => {
        if (paymentData?.transaction) {
            alert(`Payment Successful! TX: ${paymentData.transaction}`);
            refetch();
        }
    }, [paymentData, refetch]);

    const handlePay = async (invoice: Invoice) => {
        if (!selectedAccount) return;

        try {
            const networkId = import.meta.env.VITE_NETWORK_ID || 'eip155:737998412';

            // Assume invoice.amount is human readable. 
            // If it's already atomic in some contexts, we might need to adjust, 
            // but based on CreateInvoice it seems to be human readable string.
            // verifying CreateInvoice uses simple string input.

            // However, the SDK might return it as is. 
            // In PaymentForm we parse it. 
            // Let's assume invoice.amount is the string stored from creation (human readable).
            // Actually, usually APIs return atomic units or standardized strings. 
            // But looking at CreateInvoice, it sends whatever string we type.
            // If the API stores it as string, I should probably parse it.
            // But wait, if CreateInvoice sends "100", and the contract expects atomic, failure might happen if we don't parse.
            // Let's look at `PaymentForm` again. It parses input `amount` to `atomicAmount`.
            // So I should parse `invoice.amount` to atomic requirements.

            // Invoice amount is already in atomic units from backend (if created with decimals)
            // But wait, if we changed CreateInvoice to send atomic units, then `invoice.amount` IS atomic.
            // So we don't need to parse it again.

            const atomicAmount = invoice.amount;

            await payInvoice({
                invoice: invoice,
                paymentParams: {
                    amount: atomicAmount.toString(),
                    asset: PAYMENT_TOKEN_ADDRESS,
                    network: networkId,
                    from: selectedAccount.walletAddress
                    // payTo: defaults to merchant in SDK
                }
            });
        } catch (err) {
            console.error('Failed to pay invoice:', err);
            alert(`Payment failed: ${(err as Error).message}`);
        }
    };

    if (!selectedAccount) return <p>Please create or select a Smart Account to view invoices.</p>;

    if (isPending) return <p>Loading invoices...</p>;
    if (error) return <p>Error loading invoices: {(error as Error).message}</p>;

    const handleCancel = async (invoiceId: string) => {
        try {
            await cancelInvoice(invoiceId);
            refetch(); // Refresh list after cancellation
        } catch (err) {
            console.error('Failed to cancel invoice:', err);
        }
    };

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <h2>My Invoices</h2>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    style={{ padding: '5px' }}
                >
                    {accounts?.map((acc: Account) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.walletAddress.substring(0, 10)}... ({acc.status})
                        </option>
                    ))}
                </select>

                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setRole('merchant')}
                        style={{
                            backgroundColor: role === 'merchant' ? '#007bff' : '#f0f0f0',
                            color: role === 'merchant' ? 'white' : 'black',
                            border: '1px solid #ccc',
                            padding: '5px 10px',
                            cursor: 'pointer'
                        }}
                    >
                        As Merchant
                    </button>
                    <button
                        onClick={() => setRole('payer')}
                        style={{
                            backgroundColor: role === 'payer' ? '#007bff' : '#f0f0f0',
                            color: role === 'payer' ? 'white' : 'black',
                            border: '1px solid #ccc',
                            padding: '5px 10px',
                            cursor: 'pointer'
                        }}
                    >
                        As Payer
                    </button>
                </div>

                <button onClick={() => refetch()}>Refresh</button>
            </div>

            {invoices && invoices.invoices.length === 0 ? (
                <p>No invoices found.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                                <th style={{ padding: '10px' }}>ID</th>
                                <th style={{ padding: '10px' }}>Payer</th>
                                <th style={{ padding: '10px' }}>Amount</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px' }}>Due Date</th>
                                <th style={{ padding: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices?.invoices.map((invoice: Invoice) => (
                                <tr key={invoice.invoice_id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{invoice.invoice_id}</td>
                                    <td style={{ padding: '10px' }}>{invoice.payer ? `${invoice.payer.substring(0, 6)}...` : 'Any'}</td>
                                    <td style={{ padding: '10px' }}>{formatUnits(BigInt(invoice.amount), decimals)}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: invoice.status === 'PAID' ? '#d4edda' :
                                                invoice.status === 'CANCELLED' ? '#f8d7da' :
                                                    invoice.status === 'PENDING' ? '#fff3cd' : '#e2e3e5',
                                            color: invoice.status === 'PAID' ? '#155724' :
                                                invoice.status === 'CANCELLED' ? '#721c24' :
                                                    invoice.status === 'PENDING' ? '#856404' : '#383d41'
                                        }}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px' }}>{new Date(invoice.due_date * 1000).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px' }}>
                                        {invoice.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                {role === 'payer' && (
                                                    <button
                                                        onClick={() => handlePay(invoice)}
                                                        disabled={isPaying}
                                                        style={{
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '5px 10px',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        {isPaying ? 'Paying...' : 'Pay'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCancel(invoice.invoice_id)}
                                                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
