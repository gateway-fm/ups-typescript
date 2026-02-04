import { type ReactNode, useEffect } from 'react';
import { useToken } from './TokenContext';
import { BalanceProvider, useBalances } from './BalanceContext';
import { useAccounts } from '@gateway-fm/ups-react';

// Inner component to handle initial fetch
function BalanceInitializer({ children }: { children: ReactNode }) {
    const { fetchBalances } = useBalances();
    const { data: accounts } = useAccounts();

    // Fetch balances when accounts change
    useEffect(() => {
        if (accounts && accounts.length > 0) {
            fetchBalances();
        }
    }, [accounts, fetchBalances]);

    return <>{children}</>;
}

// Wrapper that gets token info and passes to BalanceProvider
export function BalanceProviderWrapper({ children }: { children: ReactNode }) {
    const { decimals, symbol } = useToken();

    return (
        <BalanceProvider decimals={decimals} symbol={symbol}>
            <BalanceInitializer>
                {children}
            </BalanceInitializer>
        </BalanceProvider>
    );
}
