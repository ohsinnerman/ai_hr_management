'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { getNavItems } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems = user ? getNavItems(user.role) : [];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      router.replace('/login');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'flex flex-col h-full bg-primary-dark text-white transition-all duration-300 ease-in-out relative shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-dark" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-none">NexusHR</p>
              <p className="text-xs text-white/50 mt-0.5 capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium',
                  isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="shrink-0 w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto bg-accent text-primary-dark text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        <Separator className="bg-white/10" />

        {/* User Info + Logout */}
        <div className={cn('p-3', collapsed ? 'flex justify-center' : 'space-y-3')}>
          {!collapsed && user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={user.employee?.profilePhotoUrl} />
                <AvatarFallback className="bg-accent text-primary-dark text-xs font-bold">
                  {getInitials(user.employee?.firstName ?? user.email.split('@')[0], user.employee?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
                </p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={cn(
                  'text-white/60 hover:text-white hover:bg-white/10 transition-colors w-full',
                  collapsed ? 'px-2' : 'justify-start gap-3'
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Sign Out</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary border-2 border-white/20 flex items-center justify-center text-white hover:bg-primary-light transition-colors shadow-md"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
