import { api } from './client';
import type { Shipment, TrackingUpdate, PaginatedResponse, ApiResponse } from '@/types';

/**
 * Shipments API service
 */

export const shipmentsApi = {
  /**
   * Get all shipments
   */
  getShipments: async (page = 1, limit = 20): Promise<PaginatedResponse<Shipment>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Shipment>>>(
      `/shipments?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get shipment by ID
   */
  getShipment: async (id: string): Promise<Shipment> => {
    const response = await api.get<ApiResponse<Shipment>>(`/shipments/${id}`);
    return response.data;
  },

  /**
   * Update shipment status
   */
  updateShipmentStatus: async (id: string, status: string): Promise<Shipment> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/shipments/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Send location update for shipment
   */
  updateLocation: async (shipmentId: string, tracking: TrackingUpdate): Promise<void> => {
    await api.post(`/shipments/${shipmentId}/location`, tracking);
  },

  /**
   * Get shipment tracking history
   */
  getTrackingHistory: async (shipmentId: string): Promise<TrackingUpdate[]> => {
    const response = await api.get<ApiResponse<TrackingUpdate[]>>(
      `/shipments/${shipmentId}/tracking`
    );
    return response.data;
  },

  /**
   * Accept shipment (for truckers)
   */
  acceptShipment: async (shipmentId: string): Promise<Shipment> => {
    const response = await api.post<ApiResponse<Shipment>>(`/shipments/${shipmentId}/accept`);
    return response.data;
  },

  /**
   * Cancel shipment
   */
  cancelShipment: async (shipmentId: string): Promise<Shipment> => {
    const response = await api.post<ApiResponse<Shipment>>(`/shipments/${shipmentId}/cancel`);
    return response.data;
  },
};
