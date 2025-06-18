"use client";

import { useUnifiedAuth } from "@/contexts/AuthContext";
import { UnifiedBalancesAPI } from "@/lib/api/unified-functions-client";
import { useQuery } from "@tanstack/react-query";

interface UseUserBalanceReturn {
  balance: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Hook to get user balance that works for both authenticated and guest users
 * For guest users, returns balance from AuthContext to avoid unnecessary API calls
 * For authenticated users, fetches from API
 */
export function useUserBalance(): UseUserBalanceReturn {
  const { getToken, user, isAuthenticated } = useUnifiedAuth();

  const query = useQuery({
    queryKey: ['userBalance', user?.id, user?.isGuest ? 'guest' : 'auth'],
    queryFn: async () => {
      if (!user?.isGuest) {
        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        return UnifiedBalancesAPI.client.get(token);
      } else {
        return UnifiedBalancesAPI.client.get();
      }
    },
    refetchInterval: isAuthenticated ? 10000 : false,
    enabled: isAuthenticated && !!user,
    staleTime: 10000,
  });

  return {
    balance: query.data?.credits ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
