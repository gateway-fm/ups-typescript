import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { type AuthState } from '@gateway-fm/ups-sdk';
import { useUPSStore } from '../store';
import { useUPSClient } from '../provider';

export interface UseAuthReturn {
    // State
    state: AuthState;
    isAuthenticated: boolean;

    // Actions
    authenticate: UseMutationResult<void, Error, void>;
    logout: () => void;
}

export function useAuth(): UseAuthReturn {
    const client = useUPSClient();
    const authState = useUPSStore((state) => state.authState);

    const authenticateMutation = useMutation({
        mutationFn: async () => {
            await client.authenticate();
        },
    });

    return {
        state: authState,
        isAuthenticated: authState.isAuthenticated,
        authenticate: authenticateMutation,
        logout: () => client.auth.logout(),
    };
}
