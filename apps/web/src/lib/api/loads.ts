import { api } from './client';
import type { Load, LoadFormData, LoadFilters, PaginatedResponse } from '@/types';

/**
 * Loads API service
 * Aligned with backend endpoints:
 *   GET    /api/loads          - List with filters + pagination
 *   GET    /api/loads/:id      - Detail with trucker + history
 *   POST   /api/loads          - Create (business only)
 *   PATCH  /api/loads/:id/assign  - Assign to trucker (business only)
 *   PATCH  /api/loads/:id/status  - Update status
 *   PATCH  /api/loads/:id/cancel  - Cancel (business only)
 */

export const loadsApi = {
  /**
   * Get all loads with optional filters
   * Backend uses offset-based pagination (limit/offset), not page-based
   */
  getLoads: async (
    filters?: LoadFilters,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Load>> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', ((page - 1) * limit).toString());

    if (filters) {
      if (filters.status) params.set('status', filters.status);
      if (filters.origin) params.set('origin', filters.origin);
      if (filters.destination) params.set('destination', filters.destination);
      if (filters.pickupDateFrom) params.set('pickupDateFrom', filters.pickupDateFrom);
      if (filters.pickupDateTo) params.set('pickupDateTo', filters.pickupDateTo);
      if (filters.deliveryDateFrom) params.set('deliveryDateFrom', filters.deliveryDateFrom);
      if (filters.deliveryDateTo) params.set('deliveryDateTo', filters.deliveryDateTo);
      if (filters.truckerId) params.set('truckerId', String(filters.truckerId));
      if (filters.businessId) params.set('businessId', String(filters.businessId));
    }

    const response = await api.get<PaginatedResponse<Load>>(
      `/loads?${params.toString()}`
    );
    return response;
  },

  /**
   * Get load by ID (includes trucker info and history)
   */
  getLoad: async (id: string | number): Promise<Load> => {
    const response = await api.get<{ data: Load }>(`/loads/${id}`);
    return response.data;
  },

  /**
   * Create new load (business users only)
   */
  createLoad: async (data: LoadFormData): Promise<Load> => {
    const response = await api.post<{ data: Load; message: string }>('/loads', data);
    return response.data;
  },

  /**
   * Assign a load to a trucker (business users only)
   */
  assignLoad: async (loadId: number | string, truckerId: number, notes?: string): Promise<Load> => {
    const response = await api.patch<{ data: Load; message: string }>(
      `/loads/${loadId}/assign`,
      { truckerId, notes }
    );
    return response.data;
  },

  /**
   * Update load status
   * Truckers: assigned → in_transit → delivered
   * Business: any → cancelled
   */
  updateStatus: async (
    loadId: number | string,
    status: 'in_transit' | 'delivered' | 'cancelled',
    notes?: string
  ): Promise<Load> => {
    const response = await api.patch<{ data: Load; message: string }>(
      `/loads/${loadId}/status`,
      { status, notes }
    );
    return response.data;
  },

  /**
   * Cancel a load (business users only, convenience endpoint)
   */
  cancelLoad: async (loadId: number | string, notes?: string): Promise<Load> => {
    const response = await api.patch<{ data: Load; message: string }>(
      `/loads/${loadId}/cancel`,
      { notes }
    );
    return response.data;
  },
};
