import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in Indian Rupees
export function formatCurrency(amount: number, symbol = '₹'): string {
  if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(1)}L`;
  }
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

// Format date consistently
export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy'): string {
  try {
    return format(new Date(date), formatStr);
  } catch {
    return 'Invalid Date';
  }
}

// Relative time (e.g., "2 hours ago")
export function timeAgo(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

// Get initials from name
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? '';
  const last = lastName?.[0]?.toUpperCase() ?? '';
  return first + last;
}

// Status badge color mapping
export const statusColors = {
  active: 'badge-success',
  on_leave: 'badge-warning',
  suspended: 'badge-error',
  terminated: 'badge-neutral',
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  draft: 'badge-neutral',
  processed: 'badge-info',
  paid: 'badge-success',
  strong_yes: 'badge-success',
  yes: 'badge-info',
  maybe: 'badge-warning',
  no: 'badge-error',
} as const;

// Extract Axios error message
export function getErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
  return err?.response?.data?.error?.message || err?.message || 'Something went wrong. Please try again.';
}
