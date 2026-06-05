'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { type UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  super_admin: '/admin',
  hr_manager: '/hr',
  recruiter: '/recruiter',
  senior_manager: '/manager',
  employee: '/employee',
};

export default function HomePage() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();

  useEffect(() => {
    const redirectUser = async () => {
      if (!user) {
        try {
          await fetchMe();
          const currentUser = useAuthStore.getState().user;
          router.replace(currentUser ? ROLE_REDIRECTS[currentUser.role] || '/login' : '/login');
        } catch {
          router.replace('/login');
        }
      } else {
        router.replace(ROLE_REDIRECTS[user.role] || '/login');
      }
    };
    redirectUser();
  }, [user, fetchMe, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">N</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted">Loading NexusHR...</p>
      </div>
    </div>
  );
}
