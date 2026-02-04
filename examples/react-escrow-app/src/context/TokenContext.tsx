import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';

// TAU PaymentToken address and config
export const PAYMENT_TOKEN_ADDRESS = '0xCe06F92A73e888a7eb8885Bf4741eF4E5490f8Fb' as `0x${string}`;
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc.tau.gateway.fm';
export const CHAIN_ID = 737998412;

// ERC20 ABI
export const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
    },
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' }
        ],
        outputs: [{ name: 'success', type: 'bool' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: 'decimals', type: 'uint8' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: 'symbol', type: 'string' }],
    },
] as const;

// Create single public client instance
export const publicClient = createPublicClient({
    transport: http(RPC_URL),
});

// Token context for shared state
interface TokenContextValue {
    decimals: number;
    symbol: string;
    isLoading: boolean;
    formatBalance: (value: string) => string;
    getBalance: (address: string) => Promise<string>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({ children }: { children: ReactNode }) {
    const [decimals, setDecimals] = useState<number>(18);
    const [symbol, setSymbol] = useState<string>('TOKEN');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch token metadata once on mount
    useEffect(() => {
        let mounted = true;

        const fetchMetadata = async () => {
            try {
                const [dec, sym] = await Promise.all([
                    publicClient.readContract({
                        address: PAYMENT_TOKEN_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'decimals',
                    }),
                    publicClient.readContract({
                        address: PAYMENT_TOKEN_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'symbol',
                    }),
                ]);

                if (mounted) {
                    setDecimals(dec);
                    setSymbol(sym);
                }
            } catch (err) {
                console.error('Failed to fetch token metadata:', err);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchMetadata();

        return () => { mounted = false; };
    }, []);

    // Format balance to 2 decimal places
    const formatBalance = (value: string): string => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return num.toFixed(2);
    };

    // Get balance for an address
    const getBalance = async (address: string): Promise<string> => {
        try {
            const result = await publicClient.readContract({
                address: PAYMENT_TOKEN_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            });
            return formatBalance(formatUnits(result, decimals));
        } catch {
            return 'Error';
        }
    };

    return (
        <TokenContext.Provider value={{ decimals, symbol, isLoading, formatBalance, getBalance }}>
            {children}
        </TokenContext.Provider>
    );
}

export function useToken() {
    const context = useContext(TokenContext);
    if (!context) {
        throw new Error('useToken must be used within a TokenProvider');
    }
    return context;
}
