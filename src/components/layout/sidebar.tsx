'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  CreditCard,
  Calendar,
  Clock,
  Scissors,
  Package,
  UserCheck,
  Receipt,
  BarChart3,
  Building2,
  ShieldAlert,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, hasRole } = useAuth();

  const navItems = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        {
          label: 'Quick Check-in',
          href: '/check-in',
          icon: Sparkles,
          highlight: true,
        },
      ],
    },
    {
      title: 'GUEST MANAGEMENT',
      items: [
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Memberships', href: '/memberships', icon: CreditCard },
        { label: 'Visits & Usage', href: '/visits', icon: Clock },
        { label: 'Appointments', href: '/appointments', icon: Calendar },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Services Menu', href: '/services', icon: Scissors },
        { label: 'Plan Packages', href: '/plans', icon: Package },
        { label: 'Staff & Therapists', href: '/staff', icon: UserCheck },
        { label: 'Billing & Invoices', href: '/billing', icon: Receipt },
      ],
    },
    {
      title: 'INTELLIGENCE & ADMIN',
      items: [
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        ...(isSuperAdmin
          ? [{ label: 'Branches', href: '/branches', icon: Building2 }]
          : []),
        ...(isSuperAdmin || hasRole('BRANCH_MANAGER')
          ? [{ label: 'Audit Trail', href: '/audit-logs', icon: ShieldAlert }]
          : []),
        { label: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#e8e0d5] shadow-sm flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo with High-Contrast Luxury Espresso Banner from Image 3 */}
        <div className="h-24 flex items-center justify-between px-5 border-b border-[#523d2d] bg-gradient-to-r from-[#3e2c1e] via-[#483323] to-[#342418] shadow-md">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-[#2a1d13]/80 border border-[#b5915f]/60 flex items-center justify-center shadow-inner">
              <img
                src="/brand-logo.png"
                alt="The Bliss International Spa"
                className="h-14 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(224,200,150,0.6)] brightness-115 contrast-125"
              />
            </div>
            <div className="border-l border-[#614936] pl-2.5">
              <span className="font-serif-luxury font-bold text-base tracking-wider text-[#f8f5ee] uppercase block leading-tight">
                The Bliss
              </span>
              <span className="text-[10px] text-[#e0c896] font-bold tracking-widest uppercase block leading-tight mt-0.5">
                Spa ERP
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#d8c7b8] hover:text-white hover:bg-[#523d2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#8a7664]">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                      isActive
                        ? 'bg-[#f4efe6] text-[#3e2c1e] font-bold border border-[#b5915f]/30 border-r-4 border-r-[#b5915f] shadow-2xs'
                        : 'text-[#5c4a3b] hover:text-[#2d231c] hover:bg-[#fbf7f0]',
                      item.highlight &&
                        !isActive &&
                        'text-[#117a65] bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                        isActive
                          ? 'text-[#b5915f]'
                          : item.highlight
                          ? 'text-[#117a65]'
                          : 'text-[#9c8978] group-hover:text-[#3e2c1e]'
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.highlight && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Check-in
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#e8e0d5] bg-[#fbf9f5] text-center">
          <p className="text-[11px] font-serif-luxury font-bold text-[#3e2c1e]">The Bliss International Spa</p>
          <p className="text-[10px] text-[#8a7664]">Enterprise Spa ERP v2.4 • India</p>
        </div>
      </aside>
    </>
  );
}
