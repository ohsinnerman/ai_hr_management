'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Sparkles, ChevronDown, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { useChatBotStore } from '@/lib/store/chatBotStore';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/Sidebar';

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggle } = useChatBotStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    router.replace('/login');
  };

  const fullName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email?.split('@')[0];

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 shrink-0">
      {/* Mobile sidebar (hamburger → Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden w-9 h-9 p-0 mr-2"><Menu className="w-5 h-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="relative w-72 hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Search employees, documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-surface-2/60 border-transparent focus:border-accent/30 focus:bg-white h-9 text-sm rounded-xl"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="hidden sm:flex items-center gap-2 bg-accent/10 text-accent-dark hover:bg-accent/20 rounded-xl h-9 px-3"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold">AI Assistant</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative w-9 h-9 p-0 rounded-xl hover:bg-surface-2">
          <Bell className="w-[18px] h-[18px] text-muted" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 hover:bg-surface-2 rounded-xl px-2.5 py-1.5 transition-colors">
              <Avatar className="w-8 h-8 ring-2 ring-accent/20">
                <AvatarImage src={user?.employee?.profilePhotoUrl} />
                <AvatarFallback className="bg-primary text-white text-xs font-bold">
                  {getInitials(user?.employee?.firstName ?? user?.email?.split('@')[0] ?? 'U', user?.employee?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-primary-dark leading-none">{fullName}</p>
                <p className="text-[10px] text-muted capitalize leading-none mt-0.5">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/employee/profile">My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/employee/payslips">Payslips</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
