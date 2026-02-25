import { format, formatDistance, formatRelative } from 'date-fns';

/**
 * Format date utilities for consistent date formatting across the app
 */

export const formatDate = (date: string | Date, dateFormat = 'MMM dd, yyyy') => {
  return format(new Date(date), dateFormat);
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export const formatRelativeDate = (date: string | Date) => {
  return formatRelative(new Date(date), new Date());
};

/**
 * Format currency for pricing display
 */
export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format weight with proper units
 */
export const formatWeight = (weight: number, unit: 'lbs' | 'kg' = 'lbs') => {
  return `${weight.toLocaleString()} ${unit}`;
};

/**
 * Format distance with proper units
 */
export const formatDistanceUnit = (distance: number, unit: 'mi' | 'km' = 'mi') => {
  return `${distance.toLocaleString()} ${unit}`;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};
