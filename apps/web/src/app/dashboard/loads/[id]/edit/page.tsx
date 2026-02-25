'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { loadSchema } from '@/lib/validations/load';
import { useLoad, useLoads } from '@/lib/hooks/use-loads';
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

const editLoadSchema = loadSchema.extend({
  equipment_type: z
    .enum(['flatbed', 'dry_van', 'reefer', 'tanker', 'step_deck', 'lowboy'])
    .optional(),
});

type EditLoadFormData = z.infer<typeof editLoadSchema>;

function EditLoadSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid gap-4 sm:grid-cols-2">
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function EditLoadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: load, isLoading, error } = useLoad(params.id);
  const { updateLoad, isUpdating } = useLoads();
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditLoadFormData>({
    resolver: zodResolver(editLoadSchema),
  });

  const equipmentType = watch('equipment_type');

  // Pre-populate form when load data is fetched
  useEffect(() => {
    if (load) {
      reset({
        origin: load.origin,
        destination: load.destination,
        pickup_date: load.pickup_date.split('T')[0],
        delivery_date: load.delivery_date.split('T')[0],
        weight: load.weight,
        price: load.price,
        equipment_type: load.equipment_type,
        description: load.description || '',
      });
    }
  }, [load, reset]);

  // Access control: redirect non-business users or non-owners
  useEffect(() => {
    if (user && user.user_type !== 'business') {
      router.replace('/dashboard/loads');
    }
    if (load && user && load.business_id !== user.id) {
      router.replace(`/dashboard/loads/${params.id}`);
    }
  }, [user, load, router, params.id]);

  const onSubmit = (data: EditLoadFormData) => {
    updateLoad(
      { id: params.id, data: data as any },
      {
        onSuccess: () => {
          success({ title: 'Load updated successfully' });
          router.push(`/dashboard/loads/${params.id}`);
        },
        onError: () => {
          showError({ title: 'Failed to update load', message: 'Please try again.' });
        },
      }
    );
  };

  if (isLoading) {
    return <EditLoadSkeleton />;
  }

  if (error || !load) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-lg font-medium text-red-900">
                  Failed to load details
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error ? error.message : 'The load could not be found.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link href="/dashboard/loads">
                    <Button variant="outline">Back to Loads</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Don't render form for non-owners while redirect is pending
  if (user?.user_type !== 'business' || load.business_id !== user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href={`/dashboard/loads/${params.id}`}
              className="hover:text-gray-700"
            >
              &larr; Back to Load
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Load</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update the details for Load #{load.id.slice(0, 8)}
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
              Update the origin, destination, dates, and other load information.
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
                      value === '' ? undefined : (value as EditLoadFormData['equipment_type']),
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
                  onClick={() => router.push(`/dashboard/loads/${params.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
