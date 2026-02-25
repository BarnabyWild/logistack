'use client';

import { useState } from 'react';
import { useLoads } from '@/lib/hooks/use-loads';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@logistack/ui';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { LoadStatus } from '@/types';

const STATUS_OPTIONS: { label: string; value: LoadStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Booked', value: 'booked' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_VARIANT: Record<LoadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  booked: 'secondary',
  in_transit: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface LoadStatusUpdateProps {
  loadId: string;
  currentStatus: LoadStatus;
}

export function LoadStatusUpdate({ loadId, currentStatus }: LoadStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<LoadStatus | ''>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { updateLoad, isUpdating } = useLoads();
  const { success, error: showError } = useToast();

  const availableStatuses = STATUS_OPTIONS.filter((s) => s.value !== currentStatus);

  const handleStatusSelect = (value: string) => {
    setSelectedStatus(value as LoadStatus);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (!selectedStatus) return;
    updateLoad(
      { id: loadId, data: { status: selectedStatus } as any },
      {
        onSuccess: () => {
          success({ title: `Status updated to ${formatStatus(selectedStatus)}` });
          setShowConfirmation(false);
          setSelectedStatus('');
        },
        onError: () => {
          showError({ title: 'Failed to update status', message: 'Please try again.' });
        },
      }
    );
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStatus('');
  };

  return (
    <div className="flex items-center gap-3">
      <Select value="" onValueChange={handleStatusSelect}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Update status..." />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={showConfirmation} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the load status?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 py-4">
            <Badge variant={STATUS_VARIANT[currentStatus]}>
              {formatStatus(currentStatus)}
            </Badge>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            {selectedStatus && (
              <Badge variant={STATUS_VARIANT[selectedStatus]}>
                {formatStatus(selectedStatus)}
              </Badge>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
