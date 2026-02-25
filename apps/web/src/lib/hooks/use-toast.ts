import { useCallback } from 'react';
import { useUIStore } from '@/lib/store';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Custom hook for toast notifications
 */
export function useToast() {
  const { addNotification, removeNotification } = useUIStore();

  const toast = useCallback(
    (type: ToastType, options: ToastOptions) => {
      addNotification({
        type,
        title: options.title,
        message: options.message,
        duration: options.duration || 3000,
      });
    },
    [addNotification]
  );

  return {
    toast,
    success: (options: ToastOptions) => toast('success', options),
    error: (options: ToastOptions) => toast('error', options),
    warning: (options: ToastOptions) => toast('warning', options),
    info: (options: ToastOptions) => toast('info', options),
    dismiss: removeNotification,
  };
}
