import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadsApi } from '@/lib/api';
import type { LoadFilters, LoadFormData } from '@/types';

/**
 * Custom hook for load operations
 * Aligned with backend API endpoints
 */
export function useLoads(filters?: LoadFilters, page = 1, limit = 20) {
  const queryClient = useQueryClient();

  // Fetch loads
  const loadsQuery = useQuery({
    queryKey: ['loads', filters, page, limit],
    queryFn: () => loadsApi.getLoads(filters, page, limit),
  });

  // Create load mutation
  const createLoadMutation = useMutation({
    mutationFn: (data: LoadFormData) => loadsApi.createLoad(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
  });

  // Assign load mutation
  const assignLoadMutation = useMutation({
    mutationFn: ({ loadId, truckerId, notes }: { loadId: number; truckerId: number; notes?: string }) =>
      loadsApi.assignLoad(loadId, truckerId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load'] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ loadId, status, notes }: { loadId: number; status: 'in_transit' | 'delivered' | 'cancelled'; notes?: string }) =>
      loadsApi.updateStatus(loadId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load'] });
    },
  });

  // Cancel load mutation
  const cancelLoadMutation = useMutation({
    mutationFn: ({ loadId, notes }: { loadId: number; notes?: string }) =>
      loadsApi.cancelLoad(loadId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load'] });
    },
  });

  return {
    loads: loadsQuery.data?.data || [],
    pagination: loadsQuery.data?.pagination,
    isLoading: loadsQuery.isLoading,
    error: loadsQuery.error,
    createLoad: createLoadMutation.mutate,
    assignLoad: assignLoadMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    cancelLoad: cancelLoadMutation.mutate,
    isCreating: createLoadMutation.isPending,
    isAssigning: assignLoadMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isCancelling: cancelLoadMutation.isPending,
  };
}

/**
 * Custom hook for a single load
 */
export function useLoad(id: string | number) {
  return useQuery({
    queryKey: ['load', id],
    queryFn: () => loadsApi.getLoad(id),
    enabled: !!id,
  });
}
