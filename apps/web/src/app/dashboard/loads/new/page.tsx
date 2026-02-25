'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { loadSchema } from '@/lib/validations/load';
import { useLoads } from '@/lib/hooks/use-loads';
import { useAuthStore } from '@/lib/store/auth-store';
import { useToast } from '@/lib/hooks/use-toast';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Label,
} from '@logistack/ui';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EQUIPMENT_TYPES = [
  { label: 'Flatbed', value: 'flatbed' },
  { label: 'Dry Van', value: 'dry_van' },
  { label: 'Reefer', value: 'reefer' },
  { label: 'Tanker', value: 'tanker' },
  { label: 'Step Deck', value: 'step_deck' },
  { label: 'Lowboy', value: 'lowboy' },
] as const;

const createLoadSchema = loadSchema.extend({
  equipment_type: z
    .enum(['flatbed', 'dry_van', 'reefer', 'tanker', 'step_deck', 'lowboy'])
    .optional(),
});

type CreateLoadFormData = z.infer<typeof createLoadSchema>;

export default function NewLoadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createLoad, isCreating } = useLoads();
  const { success, error: showError } = useToast();

  // Access control: redirect non-business users
  useEffect(() => {
    if (user && user.user_type !== 'business') {
      router.replace('/dashboard/loads');
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLoadFormData>({
    resolver: zodResolver(createLoadSchema),
    defaultValues: {
      origin: '',
      destination: '',
      pickup_date: '',
      delivery_date: '',
      weight: undefined,
      price: undefined,
      equipment_type: undefined,
      description: '',
    },
  });

  const equipmentType = watch('equipment_type');

  const onSubmit = (data: CreateLoadFormData) => {
    createLoad(data as any, {
      onSuccess: () => {
        success({ title: 'Load created successfully' });
        router.push('/dashboard/loads');
      },
      onError: () => {
        showError({ title: 'Failed to create load', message: 'Please try again.' });
      },
    });
  };

  // Don't render form for non-business users while redirect is pending
  if (user && user.user_type !== 'business') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post New Load</h1>
              <p className="mt-1 text-sm text-gray-600">
                Fill in the details below to create a new load listing
              </p>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/loads" className="text-gray-600 hover:text-gray-900">
                Loads
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Load Details</CardTitle>
            <CardDescription>
              Provide the origin, destination, dates, and other load information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Origin & Destination */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    placeholder="e.g. Chicago, IL"
                    {...register('origin')}
                  />
                  {errors.origin && (
                    <p className="text-sm text-red-600">{errors.origin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g. Dallas, TX"
                    {...register('destination')}
                  />
                  {errors.destination && (
                    <p className="text-sm text-red-600">{errors.destination.message}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup_date">Pickup Date</Label>
                  <Input
                    id="pickup_date"
                    type="date"
                    {...register('pickup_date')}
                  />
                  {errors.pickup_date && (
                    <p className="text-sm text-red-600">{errors.pickup_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    {...register('delivery_date')}
                  />
                  {errors.delivery_date && (
                    <p className="text-sm text-red-600">{errors.delivery_date.message}</p>
                  )}
                </div>
              </div>

              {/* Weight & Price */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="e.g. 40000"
                    min={0}
                    step="any"
                    {...register('weight', { valueAsNumber: true })}
                  />
                  {errors.weight && (
                    <p className="text-sm text-red-600">{errors.weight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g. 2500"
                    min={0}
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {/* Equipment Type */}
              <div className="space-y-2">
                <Label>Equipment Type (optional)</Label>
                <Select
                  value={equipmentType ?? ''}
                  onValueChange={(value) =>
                    setValue(
                      'equipment_type',
                      value === '' ? undefined : (value as CreateLoadFormData['equipment_type']),
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipment_type && (
                  <p className="text-sm text-red-600">{errors.equipment_type.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the load..."
                  rows={4}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/loads')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Load'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
