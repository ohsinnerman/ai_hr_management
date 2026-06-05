'use client';

import { useEffect, useRef } from 'react';
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
  // Run the session check exactly once on mount. Reading the store via getState()
  // (not via hook deps) prevents a re-render loop when fetchMe sets user: null.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Hard navigation (window.location) instead of router.replace: it always lands,
    // regardless of RSC soft-nav / middleware state — avoids the "stuck loading" hang.
    const go = (path: string) => {
      window.location.replace(path);
    };

    const redirectUser = async () => {
      const { user, fetchMe } = useAuthStore.getState();
      if (user) {
        go(ROLE_REDIRECTS[user.role] || '/login');
        return;
      }
      await fetchMe(); // swallows its own errors, sets user or null
      const current = useAuthStore.getState().user;
      go(current ? ROLE_REDIRECTS[current.role] || '/login' : '/login');
    };

    redirectUser();
  }, []);

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
