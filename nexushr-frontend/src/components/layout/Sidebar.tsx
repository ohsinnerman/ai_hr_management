'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { getNavItems } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = user ? getNavItems(user.role) : [];

  // GSAP mount animation
  useEffect(() => {
    if (!navRef.current) return;
    const links = navRef.current.querySelectorAll('a');
    gsap.fromTo(
      Array.from(links),
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.04, delay: 0.2 }
    );
  }, [navItems.length]);

  // GSAP collapse/expand
  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.to(sidebarRef.current, {
      width: collapsed ? 72 : 256,
      duration: 0.35,
      ease: 'power3.inOut',
    });
  }, [collapsed]);

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
        ref={sidebarRef}
        className="flex flex-col h-full text-white relative shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 72 : 256,
          background: 'linear-gradient(180deg, #0f1729 0%, #152040 50%, #1a2a50 100%)',
        }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-white/[0.06]',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-none tracking-tight">NexusHR</p>
              <p className="text-[10px] text-white/40 mt-0.5 capitalize font-medium">{user?.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 overflow-y-auto py-5 px-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium relative group',
                  isActive
                    ? 'bg-white/[0.12] text-white shadow-inner-glow'
                    : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
                  collapsed && 'justify-center px-2'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent shadow-lg shadow-accent/40" />
                )}
                <Icon className={cn(
                  'shrink-0 w-[18px] h-[18px] transition-colors',
                  isActive ? 'text-accent' : 'text-white/40 group-hover:text-white/60'
                )} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto bg-accent/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* User Info + Logout */}
        <div className={cn('p-3', collapsed ? 'flex flex-col items-center gap-2' : 'space-y-3')}>
          {!collapsed && user && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04]">
              <Avatar className="w-9 h-9 shrink-0 ring-2 ring-white/10">
                <AvatarImage src={user.employee?.profilePhotoUrl} />
                <AvatarFallback className="bg-accent/20 text-accent text-xs font-bold">
                  {getInitials(user.employee?.firstName ?? user.email.split('@')[0], user.employee?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
                </p>
                <p className="text-[10px] text-white/30 truncate">{user.email}</p>
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
                  'text-white/40 hover:text-white hover:bg-white/[0.08] transition-all w-full rounded-xl',
                  collapsed ? 'px-2' : 'justify-start gap-3'
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-xs">Sign Out</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-accent border-2 border-primary-dark flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg shadow-accent/30"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
