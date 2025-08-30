import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth.js';

/**
 * Hook to invalidate React Query queries when authentication is refreshed
 * This ensures that all data is refetched with the new token
 */
export const useAuthRefresh = () => {
  const queryClient = useQueryClient();
  const { accessToken, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // When authentication is no longer loading and we have a token,
    // invalidate all queries to refetch with new token
    if (!authLoading && accessToken) {
      queryClient.invalidateQueries();
    }
  }, [authLoading, accessToken, queryClient]);

  return { authLoading, accessToken };
};
