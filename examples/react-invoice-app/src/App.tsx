import { useAuth, useWallet } from '@gatewayfm/ups-react';
import { WalletConnect } from './components/WalletConnect';
import { AccountCreation } from './components/AccountCreation';
import { AccountList } from './components/AccountList';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { CreateInvoice } from './components/CreateInvoice';

function App() {
    const { isAuthenticated } = useAuth();
    const { isConnected } = useWallet();

    return (
        <>
            <h1>UPS Invoice Demo</h1>

            <WalletConnect />

            <div style={{ marginTop: '20px' }}>
                {isConnected ? (
                    <>
                        {isAuthenticated ? (
                            <>
                                <AccountList />
                                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                                    <AccountCreation />
                                    <CreateInvoice />
                                </div>
                                <InvoiceDashboard />
                            </>
                        ) : (
                            <div className="card">
                                <p>Wallet connected. Please authenticate to create invoices.</p>
                                <AccountCreation />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card">
                        <p>Please connect your wallet to get started.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default App;
