import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

// Graceful dashboard error fallback (Phase 2 acceptance: never crash on API error).
export function ErrorState({ title = 'Unable to load data', message, className }: ErrorStateProps) {
  return (
    <div className={cn('card-elevated flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3 text-red-500">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-primary-dark">{title}</h3>
      <p className="text-sm text-muted mt-1 max-w-sm">
        {message || 'Something went wrong while loading this section. Please refresh the page or try again later.'}
      </p>
    </div>
  );
}
