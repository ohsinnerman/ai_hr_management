'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import type { UserRole } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginFormData = z.infer<typeof loginSchema>;

const ROLE_REDIRECTS: Record<UserRole, string> = {
  super_admin: '/admin',
  hr_manager: '/hr',
  recruiter: '/recruiter',
  senior_manager: '/manager',
  employee: '/employee',
};

// NOTE: emails match the backend seeder (`node seed.js`) which uses the @fwcit.com domain.
const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'superadmin@fwcit.com' },
  { label: 'HR Manager', email: 'hrmanager@fwcit.com' },
  { label: 'Recruiter', email: 'recruiter@fwcit.com' },
  { label: 'Manager', email: 'manager@fwcit.com' },
  { label: 'Employee', email: 'employee@fwcit.com' },
];

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData: LoginFormData) => {
    try {
      const user = await login(formData.email, formData.password);
      toast.success('Welcome back! Redirecting to your dashboard...');
      const destination = redirectTo || ROLE_REDIRECTS[user.role as UserRole] || '/';
      router.replace(destination);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const code = err?.response?.data?.error?.code;
      if (code === 'ACCOUNT_LOCKED') {
        toast.error('Account locked after too many failed attempts. Try again in 15 minutes.');
      } else if (code === 'INVALID_CREDENTIALS') {
        toast.error('Incorrect email or password. Please try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Demo@1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">NexusHR</h1>
          <p className="text-white/70 text-sm mt-1">AI-Powered HR Management</p>
        </div>

        {/* Login Card */}
        <Card className="border-white/10 bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-primary-dark">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your workspace</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@fwcit.com"
                  autoComplete="email"
                  className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <a href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`pr-10 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Account Quick Fill */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-medium text-muted text-center mb-3">
                Demo Accounts — Click to fill credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="text-left px-3 py-2 rounded-lg bg-surface-2 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                  >
                    <div className="text-xs font-semibold text-primary-dark">{acc.label}</div>
                    <div className="text-xs text-muted truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-muted mt-2">
                Password: <code className="bg-gray-100 px-1 rounded">Demo@1234</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/50 text-xs mt-6">
          &copy; 2025 FWC IT Services Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
