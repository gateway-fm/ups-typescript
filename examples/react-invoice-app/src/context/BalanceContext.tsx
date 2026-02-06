import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { formatUnits } from 'viem';
import { useAccounts } from '@gatewayfm/ups-react';
import type { Account } from '@gatewayfm/ups-sdk';
import { publicClient, PAYMENT_TOKEN_ADDRESS, ERC20_ABI } from './TokenContext';

interface BalanceContextValue {
    balances: Record<string, string>;
    balancesLoading: boolean;
    fetchBalances: () => Promise<void>;
    triggerRefresh: () => void;
    decimals: number;
    symbol: string;
    formatBalance: (value: string) => string;
}

const BalanceContext = createContext<BalanceContextValue | null>(null);

export function BalanceProvider({
    children,
    decimals,
    symbol
}: {
    children: ReactNode;
    decimals: number;
    symbol: string;
}) {
    const { data: accounts } = useAccounts();
    const [balances, setBalances] = useState<Record<string, string>>({});
    const [balancesLoading, setBalancesLoading] = useState(false);
    const [_refreshCounter, setRefreshCounter] = useState(0);

    // Format balance to 2 decimal places
    const formatBalance = useCallback((value: string): string => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return num.toFixed(2);
    }, []);

    // Fetch balances for all accounts
    const fetchBalances = useCallback(async () => {
        if (!accounts || accounts.length === 0) return;

        console.log('[BalanceContext] Fetching balances for', accounts.length, 'accounts');
        setBalancesLoading(true);
        try {
            const results = await Promise.all(
                accounts.map(async (account: Account) => {
                    try {
                        const result = await publicClient.readContract({
                            address: PAYMENT_TOKEN_ADDRESS,
                            abi: ERC20_ABI,
                            functionName: 'balanceOf',
                            args: [account.walletAddress as `0x${string}`],
                        });
                        const bal = formatBalance(formatUnits(result, decimals));
                        console.log(`[BalanceContext] ${account.walletAddress.slice(0, 10)}: ${bal}`);
                        return { id: account.id, balance: bal };
                    } catch (err) {
                        console.error('[BalanceContext] Error:', err);
                        return { id: account.id, balance: 'Error' };
                    }
                })
            );
            const map: Record<string, string> = {};
            results.forEach((r: { id: string; balance: string }) => (map[r.id] = r.balance));
            setBalances(map);
            console.log('[BalanceContext] Balances updated');
        } finally {
            setBalancesLoading(false);
        }
    }, [accounts, decimals, formatBalance]);

    // Store in ref for stable access
    const fetchBalancesRef = useRef(fetchBalances);
    fetchBalancesRef.current = fetchBalances;

    // Trigger a refresh - this can be called from any component
    const triggerRefresh = useCallback(() => {
        console.log('[BalanceContext] Refresh triggered');
        // Immediate fetch
        fetchBalancesRef.current();

        // Also fetch after delays for blockchain propagation
        setTimeout(() => fetchBalancesRef.current(), 2000);
        setTimeout(() => fetchBalancesRef.current(), 5000);

        setRefreshCounter(c => c + 1);
    }, []);

    return (
        <BalanceContext.Provider value={{
            balances,
            balancesLoading,
            fetchBalances,
            triggerRefresh,
            decimals,
            symbol,
            formatBalance,
        }}>
            {children}
        </BalanceContext.Provider>
    );
}

export function useBalances() {
    const context = useContext(BalanceContext);
    if (!context) {
        throw new Error('useBalances must be used within a BalanceProvider');
    }
    return context;
}
