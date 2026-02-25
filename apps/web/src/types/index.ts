/**
 * Core type definitions for Logistack frontend
 * Aligned with backend API response format (camelCase from Drizzle ORM)
 */

// User types
export type UserType = 'trucker' | 'business';

export interface User {
  id: number;
  email: string;
  userType: UserType;
  phone?: string | null;
  companyName?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  insuranceInfo?: Record<string, any> | null;
  profileData?: Record<string, any>;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Load types - matches backend load_status_enum
export type LoadStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Load {
  id: number;
  businessId: number;
  truckerId: number | null;
  originLocation: string;
  destinationLocation: string;
  weight: string; // decimal from DB comes as string
  description: string | null;
  price: string; // decimal from DB comes as string
  pickupDate: string;
  deliveryDate: string;
  status: LoadStatus;
  createdAt: string;
  updatedAt: string;
  // Joined fields (from detail endpoint)
  trucker?: {
    id: number;
    email: string;
    phone?: string | null;
    companyName?: string | null;
    mcNumber?: string | null;
    dotNumber?: string | null;
  } | null;
  history?: LoadHistoryEntry[];
}

export interface LoadHistoryEntry {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  notes: string | null;
  changedAt: string;
  changedBy: number | null;
}

// Shipment types (from routes table)
export type ShipmentStatus = 'draft' | 'active' | 'matched' | 'in_transit' | 'completed' | 'cancelled' | 'expired';

export interface Shipment {
  id: number;
  truckerId: number;
  startLocation: string;
  endLocation: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  departureDate: string;
  arrivalDate: string;
  availableCapacity: string;
  equipmentType: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

// Location tracking types
export interface GpsLocation {
  id: number;
  loadId: number;
  truckerId: number;
  latitude: string;
  longitude: string;
  altitude?: string | null;
  speed?: string | null;
  heading?: string | null;
  accuracy?: string | null;
  deviceId?: string | null;
  recordedAt: string;
  createdAt: string;
}

// API Response types - matches backend response format
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  errors?: Array<{ message: string; path?: string[] }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  user_type: UserType;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Form types - what the frontend form sends
export interface LoadFormData {
  originLocation: string;
  destinationLocation: string;
  weight: number;
  price: number;
  pickupDate: string;
  deliveryDate: string;
  description?: string;
}

// Filter types - matches backend query params
export interface LoadFilters {
  status?: LoadStatus;
  origin?: string;
  destination?: string;
  pickupDateFrom?: string;
  pickupDateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  truckerId?: number;
  businessId?: number;
  limit?: number;
  offset?: number;
}

// Equipment type (for shipments/routes, not loads)
export type EquipmentType = 'dry_van' | 'flatbed' | 'reefer' | 'step_deck' | 'lowboy' | 'tanker' | 'box_truck' | 'power_only' | 'hotshot' | 'container';

// Map types
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}
