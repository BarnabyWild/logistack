'use client';

import { useState } from 'react';
import { useLoads } from '@/lib/hooks/use-loads';
import { useToast } from '@/lib/hooks/use-toast';
import { Button, Input, Label } from '@logistack/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface LoadAssignmentDialogProps {
  loadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LoadAssignmentDialog({ loadId, isOpen, onClose }: LoadAssignmentDialogProps) {
  const [truckerId, setTruckerId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { bookLoad, isBooking } = useLoads();
  const { success, error: showError } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckerId.trim()) return;
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    bookLoad(loadId, {
      onSuccess: () => {
        success({ title: 'Load assigned successfully' });
        handleClose();
      },
      onError: () => {
        showError({ title: 'Failed to assign load', message: 'Please try again.' });
      },
    });
  };

  const handleClose = () => {
    setTruckerId('');
    setShowConfirmation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Load</DialogTitle>
          <DialogDescription>
            Enter a trucker ID to assign this load. The trucker will be notified of the assignment.
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trucker-id">Trucker ID</Label>
              <Input
                id="trucker-id"
                placeholder="Enter trucker ID..."
                value={truckerId}
                onChange={(e) => setTruckerId(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!truckerId.trim()}>
                Search & Assign
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Confirm Assignment</p>
              <p className="mt-1 text-sm text-amber-700">
                Are you sure you want to assign this load to trucker{' '}
                <span className="font-mono font-semibold">{truckerId}</span>?
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isBooking}
              >
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isBooking}>
                {isBooking ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
