import { useAuth } from '@x402-ups/react';
import { WalletConnect } from './components/WalletConnect';
import { AccountCreation } from './components/AccountCreation';
import { AccountInfo } from './components/AccountInfo';
import { PaymentForm } from './components/PaymentForm';

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <h1>UPS SDK React Example</h1>

            <WalletConnect />

            <div style={{ marginTop: '20px' }}>
                {isAuthenticated ? (
                    <>
                        <AccountInfo />
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <AccountCreation />
                            <PaymentForm />
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <p>Please connect wallet and authenticate to access features.</p>
                        <AccountCreation />
                    </div>
                )}
            </div>
        </>
    );
}

export default App;
