import { useAuthStore } from '@/lib/store/auth-store';
import { api } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginCredentials, User } from '@/types';

/**
 * Custom hook for authentication operations
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<{ data: { user: User; token: string } }>(
        '/auth/login',
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      setUser({
        id: data.user.id,
        email: data.user.email,
        user_type: data.user.user_type,
        full_name: data.user.email,
      });
      // Token is handled by API client interceptors
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
