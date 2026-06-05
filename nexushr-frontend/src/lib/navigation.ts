import {
  LayoutDashboard, Users, Clock, Calendar, DollarSign,
  Briefcase, BarChart3, Settings, User, Star, FileText,
  Building2, Award,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
}

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Attendance', href: '/hr/attendance', icon: Clock },
    { label: 'Leaves', href: '/hr/leaves', icon: Calendar },
    { label: 'Payroll', href: '/hr/payroll', icon: DollarSign },
    { label: 'Recruitment', href: '/recruiter/jobs', icon: Briefcase },
    { label: 'Performance', href: '/hr/performance', icon: Star },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  hr_manager: [
    { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Attendance', href: '/hr/attendance', icon: Clock },
    { label: 'Leaves', href: '/hr/leaves', icon: Calendar },
    { label: 'Payroll', href: '/hr/payroll', icon: DollarSign },
    { label: 'Performance', href: '/hr/performance', icon: Star },
    { label: 'Documents', href: '/hr/documents', icon: FileText },
  ],
  recruiter: [
    { label: 'Dashboard', href: '/recruiter', icon: LayoutDashboard },
    { label: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
    { label: 'Candidates', href: '/recruiter/candidates', icon: Users },
    { label: 'Interviews', href: '/recruiter/interviews', icon: Calendar },
  ],
  senior_manager: [
    { label: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { label: 'Team', href: '/manager/team', icon: Users },
    { label: 'Attendance', href: '/manager/attendance', icon: Clock },
    { label: 'Leaves', href: '/manager/leaves', icon: Calendar },
    { label: 'Performance', href: '/manager/performance', icon: Star },
  ],
  employee: [
    { label: 'Dashboard', href: '/employee', icon: LayoutDashboard },
    { label: 'Attendance', href: '/employee/attendance', icon: Clock },
    { label: 'Leaves', href: '/employee/leaves', icon: Calendar },
    { label: 'Payslips', href: '/employee/payslips', icon: DollarSign },
    { label: 'Performance', href: '/employee/performance', icon: Award },
    { label: 'Profile', href: '/employee/profile', icon: User },
  ],
};

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_CONFIG[role] || [];
}
