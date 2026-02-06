import { useState } from 'react';
import { useCreateInvoice } from '@gatewayfm/ups-react';
import { parseUnits } from 'viem';
import { useBalances } from '../context/BalanceContext';

export const CreateInvoice = () => {
    const { createInvoice, isPending, error } = useCreateInvoice();
    const [merchant, setMerchant] = useState('');
    const [payer, setPayer] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [paymentType, setPaymentType] = useState<'DIRECT' | 'ESCROW'>('DIRECT');
    const { decimals } = useBalances();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const request = {
                merchant: merchant || undefined,
                payer,
                amount: parseUnits(amount, decimals).toString(),
                due_date: Math.floor(new Date(dueDate).getTime() / 1000), // Unix timestamp in seconds (integer)
                payment_type: paymentType,
                metadata_uri: 'ipfs://Qm...' // Example metadata
            };
            console.log('Creating invoice with request:', request);
            await createInvoice(request);
            // Reset form
            setMerchant('');
            setPayer('');
            setAmount('');
            setDueDate('');
        } catch (err) {
            console.error('Failed to create invoice:', err);
        }
    };

    return (
        <div className="card">
            <h2>Create Invoice</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label>Merchant Address (Optional):</label>
                    <input
                        type="text"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        placeholder="0x... (Leave empty for default)"
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <div>
                    <label>Payer Address:</label>
                    <input
                        type="text"
                        value={payer}
                        onChange={(e) => setPayer(e.target.value)}
                        placeholder="0x..."
                        required
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <div>
                    <label>Amount (Tokens):</label>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100.0"
                        required
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <div>
                    <label>Due Date:</label>
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <div>
                    <label>Payment Type:</label>
                    <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value as 'DIRECT' | 'ESCROW')}
                        style={{ width: '100%', padding: '5px' }}
                    >
                        <option value="DIRECT">Direct</option>
                        <option value="ESCROW">Escrow</option>
                    </select>
                </div>
                <button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Invoice'}
                </button>
                {error && <p style={{ color: 'red' }}>Error: {(error as Error).message}</p>}
            </form>
        </div>
    );
};
