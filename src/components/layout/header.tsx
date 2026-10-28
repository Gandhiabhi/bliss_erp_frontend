'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth, BranchView } from '@/lib/auth/auth-context';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/lib/api/branches.api';
import { Button } from '@/components/ui/button';
import { Menu, Building2, LogOut, Globe, Shield, Sparkles } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, isSuperAdmin, activeBranchId, currentBranch, setActiveBranchId, logout } = useAuth();

  const { data: branchesRes } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => branchesApi.getAll(),
    enabled: isSuperAdmin,
  });

  const branches = branchesRes?.data || [];

  const toView = (match: (typeof branches)[number]): BranchView => ({
    id: match.id,
    branchCode: match.branchCode,
    name: match.name,
    currency: match.currency,
    timezone: match.timezone,
    country: match.country,
    city: match.city,
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (branches.length === 1) {
      const only = branches[0];
      if (activeBranchId === only.id && currentBranch?.id === only.id) return;
      setActiveBranchId(only.id, toView(only));
      return;
    }
    if (!activeBranchId || currentBranch?.id === activeBranchId) return;
    const match = branches.find((b) => b.id === activeBranchId);
    if (!match) return;
    setActiveBranchId(activeBranchId, toView(match));
  }, [isSuperAdmin, activeBranchId, currentBranch?.id, branches, setActiveBranchId]);

  return (
    <header className="h-16 border-b border-[#e8e0d5] bg-[#fbf9f5]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left side: Hamburger + active branch info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-[#705f52] hover:text-[#2d231c] hover:bg-[#f4efe6] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Branch Selector / Indicator */}
        {isSuperAdmin && branches.length > 1 ? (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#b5915f] hidden sm:block" />
            <select
              value={activeBranchId || ''}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setActiveBranchId(null);
                  return;
                }
                const match = branches.find((b) => b.id === id);
                const snapshot: BranchView | null = match ? toView(match) : null;
                setActiveBranchId(id, snapshot);
              }}
              className="h-9 px-3 py-1 bg-white border border-[#e2d8ca] rounded-xl text-xs font-semibold text-[#2d231c] focus:outline-none focus:border-[#b5915f] cursor-pointer shadow-2xs"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e2d8ca] shadow-2xs">
            <Building2 className="w-4 h-4 text-[#b5915f]" />
            <div className="text-left">
              <span className="text-xs font-bold text-[#2d231c] block leading-tight">
                {currentBranch?.name || user?.branch?.name || 'Your spa'}
              </span>
              <span className="text-[10px] text-[#705f52] block leading-tight font-medium">
                {currentBranch?.city || user?.branch?.city || 'Single location'} • ₹ INR
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Fast check-in shortcut + User info + Logout */}
      <div className="flex items-center gap-3">
        <Link href="/check-in" className="hidden sm:inline-flex">
          <Button variant="gold" size="sm" className="shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Fast Check-in
          </Button>
        </Link>

        {/* User profile capsule */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#e8e0d5]">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#2d231c] leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-[#b5915f]" />
              <span className="text-[10px] font-bold text-[#b5915f] uppercase tracking-wider">
                {user?.roles?.[0] || 'Staff'}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3e2c1e] to-[#523d2d] flex items-center justify-center font-bold text-[#f8f5ee] text-xs shadow-xs border border-[#b5915f]/60">
            {user?.firstName?.charAt(0) || 'U'}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sign out of ERP"
            className="text-[#9c8978] hover:text-[#be3a34] hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
