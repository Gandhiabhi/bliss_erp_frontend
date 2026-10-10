'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard.api';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import {
  DollarSign,
  Users,
  CreditCard,
  Clock,
  Sparkles,
  Calendar,
  Building2,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { isSuperAdmin, activeBranchId, currentBranch } = useAuth();

  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['dashboard-stats', activeBranchId],
    queryFn: () => dashboardApi.getStats(activeBranchId || undefined),
  });

  const dashboardData = statsRes?.data;
  const stats = dashboardData?.stats;
  const currency = 'INR';

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSuperAdmin && !activeBranchId
            ? 'Spa Network Executive Overview'
            : `${currentBranch?.name || 'Branch'} Dashboard`
        }
        description={
          isSuperAdmin && !activeBranchId
            ? 'Real-time performance across branches and treatment suites in Indian Rupees (₹).'
            : `Daily operations, guest check-ins, therapist appointments, and membership stats.`
        }
      >
        <Link href="/check-in">
          <Button variant="gold" size="md">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Fast Check-in
          </Button>
        </Link>
        <Link href="/customers">
          <Button variant="secondary" size="md">
            <Users className="w-4 h-4 mr-1.5" />
            New Guest
          </Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <LoadingState message="Aggregating live spa business metrics..." />
      ) : (
        <div className="space-y-8">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatsCard
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue, 'INR')}
              subtitle={`Month to date: ${formatCurrency(stats?.monthRevenue, 'INR')}`}
              icon={<span className="text-base font-bold text-[#b5915f] font-mono leading-none">₹</span>}
              trend={{ value: 'Live', isPositive: true }}
            />
            <StatsCard
              title="Today's Check-ins"
              value={stats?.todayVisits ?? 0}
              subtitle="Completed & in-service sessions"
              icon={<Clock className="w-5 h-5 text-[#117a65]" />}
            />
            <StatsCard
              title="Active Memberships"
              value={stats?.activeMemberships ?? 0}
              subtitle={
                stats?.expiringMemberships > 0
                  ? `${stats.expiringMemberships} expiring within 7 days`
                  : 'All memberships valid'
              }
              icon={<CreditCard className="w-5 h-5 text-[#b5915f]" />}
              trend={
                stats?.expiringMemberships > 0
                  ? { value: `${stats.expiringMemberships} Alert`, isPositive: false }
                  : undefined
              }
            />
            <StatsCard
              title="Registered Guests"
              value={stats?.totalCustomers ?? 0}
              subtitle={`+${stats?.newCustomersToday ?? 0} new guests joined today`}
              icon={<Users className="w-5 h-5 text-[#705f52]" />}
              trend={{ value: `+${stats?.newCustomersToday ?? 0} New`, isPositive: true }}
            />
          </div>

          {/* Super Admin Multi-Branch Comparison Summary */}
          {isSuperAdmin && dashboardData?.branchSummaries && (
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-[#2d231c]">
                    <Building2 className="w-4 h-4 text-[#b5915f]" />
                    Branch Network Performance (Live Indian Spa Metrics)
                  </CardTitle>
                  <p className="text-xs text-[#705f52] mt-1 font-medium">
                    Factual metrics and live operations across branches in Indian Rupees (₹).
                  </p>
                </div>
                <Link href="/branches">
                  <Button variant="ghost" size="sm" className="text-[#b5915f] hover:text-[#9e7934] text-xs">
                    View Branches <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-[#e8e0d5]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf9f5] border-b border-[#e8e0d5]">
                      <tr className="text-[#705f52] uppercase tracking-wider font-bold">
                        <th className="py-3 pl-3">Branch Code & Name</th>
                        <th className="py-3">Location</th>
                        <th className="py-3 text-right">Guests</th>
                        <th className="py-3 text-right">Plans</th>
                        <th className="py-3 text-right">Visits</th>
                        <th className="py-3 text-right">Monthly Revenue</th>
                        <th className="py-3 text-center pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2ebe0] bg-white">
                      {dashboardData.branchSummaries.map((b: any) => (
                        <tr key={b.id} className="hover:bg-[#fbf9f5] transition-colors">
                          <td className="py-3.5 pl-3 font-semibold text-[#2d231c]">
                            <span className="font-mono text-[#b5915f] font-bold mr-2">{b.code}</span>
                            {b.name}
                          </td>
                          <td className="py-3.5 text-[#705f52]">
                            {b.city}, {b.country}
                          </td>
                          <td className="py-3.5 text-right font-medium text-[#2d231c]">
                            {b.customersCount}
                          </td>
                          <td className="py-3.5 text-right font-medium text-[#2d231c]">
                            {b.membershipsCount}
                          </td>
                          <td className="py-3.5 text-right font-medium text-[#2d231c]">
                            {b.visitsCount}
                          </td>
                          <td className="py-3.5 text-right font-bold text-[#117a65]">
                            {formatCurrency(b.monthlyRevenue, 'INR')}
                          </td>
                          <td className="py-3.5 text-center pr-3">
                            <StatusBadge status={b.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2-Column Section: Recent Check-ins vs Upcoming Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Check-ins & Service Consumptions */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Recent Check-ins & Treatments
                </CardTitle>
                <Link href="/visits">
                  <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800">
                    All Visits <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentVisits?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No visits recorded yet today.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData?.recentVisits?.map((v: any) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition-all shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">
                            {v.customer?.displayName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {v.visitServices?.[0]?.service?.name || 'Spa Service'}
                            {v.visitServices?.[0]?.staff?.name && (
                              <span className="text-amber-700"> • {v.visitServices[0].staff.name}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={v.status} size="sm" />
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {formatDateTime(v.visitDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Upcoming Spa Appointments
                </CardTitle>
                <Link href="/appointments">
                  <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800">
                    Schedule <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {dashboardData?.upcomingAppointments?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No pending appointments.</p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData?.upcomingAppointments?.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition-all shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">
                            {apt.customer?.displayName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {apt.service?.name}
                            {apt.staff?.name && (
                              <span className="text-emerald-700"> • {apt.staff.name}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-700 block font-mono">
                            {apt.startTime} - {apt.endTime}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {formatDate(apt.scheduledDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
