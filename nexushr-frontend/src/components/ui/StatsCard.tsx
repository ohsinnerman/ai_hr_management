'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCountUp } from '@/lib/hooks/useGSAP';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string; positive?: boolean };
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'accent' | 'dark';
}

export function StatsCard({
  title, value, subtitle, icon, iconBg = 'bg-accent/10', trend, isLoading, className, variant = 'default',
}: StatsCardProps) {
  const countRef = useCountUp(typeof value === 'number' ? value : 0);

  if (isLoading) {
    return (
      <div className={cn('card-bento', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
      </div>
    );
  }

  const baseClass = variant === 'dark'
    ? 'card-dark'
    : variant === 'accent'
      ? 'card-accent'
      : 'card-bento';

  return (
    <div className={cn(baseClass, className)} data-animate>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-xs font-medium tracking-wide uppercase',
            variant === 'dark' ? 'text-white/50' : 'text-muted'
          )}>{title}</p>
          <p className={cn(
            'text-3xl font-extrabold mt-2 tracking-tight',
            variant === 'dark' ? 'text-white' : 'text-primary-dark'
          )}>
            {typeof value === 'number' ? (
              <span ref={countRef}>0</span>
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1.5',
              variant === 'dark' ? 'text-white/40' : 'text-muted'
            )}>{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1.5 mt-3 text-xs font-semibold',
              trend.positive !== false ? 'text-emerald-600' : 'text-red-500'
            )}>
              {trend.positive !== false
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />
              }
              <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
          variant === 'dark' ? 'bg-white/10' : iconBg
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
