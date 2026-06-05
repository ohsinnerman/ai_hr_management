'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatBotFloating } from '@/components/ai/ChatBotFloating';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  // Attempt session restore exactly once on mount (guarded so fetchMe's user:null
  // result can't retrigger the effect into a loop).
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { user: u, accessToken, fetchMe } = useAuthStore.getState();
    if (u) return; // already authenticated
    if (!accessToken) {
      fetchMe().then(() => {
        // Hard redirect so we reliably leave the loading state when there's no session.
        if (!useAuthStore.getState().user) window.location.replace('/login');
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
      <ChatBotFloating />
    </div>
  );
}
