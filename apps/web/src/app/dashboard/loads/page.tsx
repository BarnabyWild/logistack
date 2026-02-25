'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLoads } from '@/lib/hooks/use-loads';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@logistack/ui';
import type { LoadFilters, LoadStatus, EquipmentType, Load } from '@/types';

const LOAD_STATUSES: { label: string; value: LoadStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Booked', value: 'booked' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const EQUIPMENT_TYPES: { label: string; value: EquipmentType | '' }[] = [
  { label: 'All Equipment', value: '' },
  { label: 'Flatbed', value: 'flatbed' },
  { label: 'Dry Van', value: 'dry_van' },
  { label: 'Reefer', value: 'reefer' },
  { label: 'Tanker', value: 'tanker' },
  { label: 'Step Deck', value: 'step_deck' },
  { label: 'Lowboy', value: 'lowboy' },
];

const STATUS_COLORS: Record<LoadStatus, string> = {
  available: 'bg-blue-100 text-blue-800',
  booked: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-green-100 text-green-800',
  delivered: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ITEMS_PER_PAGE = 20;

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEquipmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function LoadsPage() {
  const { user } = useAuthStore();
  const isBusiness = user?.user_type === 'business';

  // Filter state (immediate for UI, debounced for API)
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoadStatus | ''>('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | ''>('');
  const [page, setPage] = useState(1);

  // Debounce text inputs to avoid excessive API calls
  const debouncedOrigin = useDebounce(searchOrigin, 300);
  const debouncedDestination = useDebounce(searchDestination, 300);

  // Build filters object from debounced values
  const filters = useMemo<LoadFilters>(() => {
    const f: LoadFilters = {};
    if (debouncedOrigin.trim()) f.origin = debouncedOrigin.trim();
    if (debouncedDestination.trim()) f.destination = debouncedDestination.trim();
    if (statusFilter) f.status = statusFilter;
    if (equipmentFilter) f.equipment_type = equipmentFilter;
    return f;
  }, [debouncedOrigin, debouncedDestination, statusFilter, equipmentFilter]);

  const { loads, meta, isLoading, error, bookLoad, isBooking } = useLoads(
    filters,
    page,
    ITEMS_PER_PAGE
  );

  const totalPages = meta?.totalPages ?? 1;

  // Reset to page 1 when debounced filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedOrigin, debouncedDestination, statusFilter, equipmentFilter]);

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as LoadStatus | '');
    },
    []
  );

  const handleEquipmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setEquipmentFilter(e.target.value as EquipmentType | '');
    },
    []
  );

  function clearFilters() {
    setSearchOrigin('');
    setSearchDestination('');
    setStatusFilter('');
    setEquipmentFilter('');
    setPage(1);
  }

  const hasActiveFilters =
    searchOrigin || searchDestination || statusFilter || equipmentFilter;
  const showEquipmentColumn = loads.some((l) => l.equipment_type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isBusiness ? 'My Loads' : 'Available Loads'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {isBusiness
                  ? 'Manage and track your posted loads'
                  : 'Browse and book available loads'}
              </p>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/loads" className="font-medium text-gray-900">
                Loads
              </Link>
              {isBusiness && (
                <Link href="/dashboard/loads/new">
                  <Button size="sm">Post New Load</Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Origin
                </label>
                <Input
                  placeholder="e.g. Chicago, IL"
                  value={searchOrigin}
                  onChange={(e) => setSearchOrigin(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Destination
                </label>
                <Input
                  placeholder="e.g. Dallas, TX"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={statusFilter}
                  onChange={handleStatusChange}
                >
                  {LOAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Equipment Type
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={equipmentFilter}
                  onChange={handleEquipmentChange}
                >
                  {EQUIPMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {meta?.total != null
                    ? `${meta.total} load${meta.total !== 1 ? 's' : ''} found`
                    : 'Filtering results...'}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-2 text-sm text-gray-600">Loading loads...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-center text-red-700">
                Failed to load data. Please try again later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && loads.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-900">No loads found</p>
                <p className="mt-1 text-sm text-gray-600">
                  {hasActiveFilters
                    ? 'Try adjusting your search filters'
                    : isBusiness
                      ? 'Post your first load to get started'
                      : 'No loads are available right now. Check back soon!'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loads Table */}
        {!isLoading && !error && loads.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Route</th>
                    <th className="px-6 py-3">Dates</th>
                    <th className="px-6 py-3">Weight</th>
                    {showEquipmentColumn && <th className="px-6 py-3">Equipment</th>}
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loads.map((load: Load) => (
                    <LoadRow
                      key={load.id}
                      load={load}
                      isBusiness={isBusiness}
                      showEquipment={showEquipmentColumn}
                      onBook={bookLoad}
                      isBooking={isBooking}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                  {meta?.total != null && (
                    <span className="ml-1">({meta.total} total loads)</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <PageNumbers
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

function LoadRow({
  load,
  isBusiness,
  showEquipment,
  onBook,
  isBooking,
}: {
  load: Load;
  isBusiness: boolean;
  showEquipment: boolean;
  onBook: (loadId: string) => void;
  isBooking: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{load.origin}</p>
          <p className="text-sm text-gray-500">&rarr; {load.destination}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-gray-900">Pickup: {formatDate(load.pickup_date)}</p>
          <p className="text-gray-500">Delivery: {formatDate(load.delivery_date)}</p>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
        {load.weight.toLocaleString()} lbs
      </td>
      {showEquipment && (
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {load.equipment_type ? formatEquipmentType(load.equipment_type) : '\u2014'}
        </td>
      )}
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {formatCurrency(load.price)}
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[load.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {formatStatus(load.status)}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex gap-2">
          <Link href={`/dashboard/loads/${load.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          {!isBusiness && load.status === 'available' && (
            <Button size="sm" disabled={isBooking} onClick={() => onBook(load.id)}>
              {isBooking ? 'Booking...' : 'Book'}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);

      if (currentPage > 3) items.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) items.push(i);

      if (currentPage < totalPages - 2) items.push('ellipsis');

      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="flex gap-1">
      {pages.map((item, idx) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
              item === currentPage
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
}
