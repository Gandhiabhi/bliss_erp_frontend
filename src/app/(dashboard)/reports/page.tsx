'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Building2,
  Scissors,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react';

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function ReportsPage() {
  const { currentBranch, isSuperAdmin } = useAuth();
  const [reportType, setReportType] = useState<
    'MONTHLY' | 'BRANCH_COMPARISON' | 'SERVICES' | 'MEMBERSHIPS'
  >('MONTHLY');

  // Reports queries
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['report-monthly', currentBranch?.id],
    queryFn: () => reportsApi.getMonthly(undefined, undefined, currentBranch?.id),
    enabled: reportType === 'MONTHLY',
  });

  const { data: branchCompData, isLoading: isBranchCompLoading } = useQuery({
    queryKey: ['report-branch-comp'],
    queryFn: () => reportsApi.getBranchComparison(),
    enabled: reportType === 'BRANCH_COMPARISON',
  });

  const { data: serviceUsageData, isLoading: isServiceUsageLoading } = useQuery({
    queryKey: ['report-service-usage', currentBranch?.id],
    queryFn: () => reportsApi.getServiceUsage(currentBranch?.id),
    enabled: reportType === 'SERVICES',
  });

  const { data: membershipsData, isLoading: isMembershipsLoading } = useQuery({
    queryKey: ['report-memberships', currentBranch?.id],
    queryFn: () => reportsApi.getMemberships(currentBranch?.id),
    enabled: reportType === 'MEMBERSHIPS',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence & Analytics"
        description="Fact-based reports, service entitlement consumption trends, and financial performance"
      />

      {/* Report Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setReportType('MONTHLY')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            reportType === 'MONTHLY'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Monthly Financials & Visits
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setReportType('BRANCH_COMPARISON')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
              reportType === 'BRANCH_COMPARISON'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Branch Benchmarks
          </button>
        )}

        <button
          onClick={() => setReportType('SERVICES')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            reportType === 'SERVICES'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Treatment Utilization
        </button>

        <button
          onClick={() => setReportType('MEMBERSHIPS')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            reportType === 'MEMBERSHIPS'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Package Lifecycles
        </button>
      </div>

      {/* REPORT 1: MONTHLY FINANCIALS */}
      {reportType === 'MONTHLY' && (
        <div className="space-y-6">
          {isMonthlyLoading ? (
            <LoadingState message="Aggregating monthly financial metrics..." />
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Monthly Revenue"
                  value={formatCurrency(monthlyData?.data?.summary?.totalRevenue || 0, 'INR')}
                  icon={DollarSign}
                />
                <StatsCard
                  title="Total Guest Visits"
                  value={monthlyData?.data?.summary?.totalVisits || 0}
                  icon={Clock}
                />
                <StatsCard
                  title="Memberships Enrolled"
                  value={monthlyData?.data?.summary?.membershipsSold || 0}
                  icon={CreditCard}
                />
                <StatsCard
                  title="New Guests Registered"
                  value={monthlyData?.data?.summary?.newCustomers || 0}
                  icon={Users}
                />
              </div>

              {/* Daily Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Daily Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyData?.data?.dailyBreakdown || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          tickFormatter={(val) => val.slice(-2)}
                        />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            color: '#0f172a',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#d97706"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#revenueGrad)"
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Visits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Daily Guest Attendance & Treatments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData?.data?.dailyBreakdown || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          tickFormatter={(val) => val.slice(-2)}
                        />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            color: '#0f172a',
                          }}
                        />
                        <Bar
                          dataKey="visits"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Visits"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* REPORT 2: BRANCH COMPARISON (SUPER ADMIN) */}
      {reportType === 'BRANCH_COMPARISON' && (
        <div className="space-y-6">
          {isBranchCompLoading ? (
            <LoadingState message="Comparing multi-branch international metrics..." />
          ) : (
            <>
              {/* Branch Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Currency</th>
                      <th className="px-6 py-4">Active Memberships</th>
                      <th className="px-6 py-4">Completed Visits</th>
                      <th className="px-6 py-4">Total Revenue</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchCompData?.data?.map((branch: any) => (
                      <tr
                        key={branch.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {branch.name}
                          <span className="block text-xs font-mono font-normal text-slate-400">
                            {branch.branchCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {branch.city}, {branch.country}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-[#b5915f]">
                          ₹ INR
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {branch.activeMemberships}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {branch.completedVisits}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#117a65]">
                          {formatCurrency(branch.totalRevenue, 'INR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {branch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Branch Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">
                    Revenue Comparison Across Global Spas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={branchCompData?.data || []}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            color: '#0f172a',
                          }}
                        />
                        <Bar
                          dataKey="totalRevenue"
                          fill="#d97706"
                          radius={[6, 6, 0, 0]}
                          name="Total Revenue"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* REPORT 3: TREATMENT UTILIZATION */}
      {reportType === 'SERVICES' && (
        <div className="space-y-6">
          {isServiceUsageLoading ? (
            <LoadingState message="Analyzing treatment usage and consumption..." />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Treatment</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Sessions Delivered</th>
                      <th className="px-6 py-4">Generated Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceUsageData?.data?.map((service: any, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-700">
                            {idx + 1}
                          </span>
                          {service.serviceName}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{service.category}</td>
                        <td className="px-6 py-4 font-bold text-amber-700">
                          {service.quantity} sessions
                        </td>
                        <td className="px-6 py-4 font-bold text-[#117a65]">
                          {formatCurrency(service.revenue, 'INR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* REPORT 4: MEMBERSHIPS LIFECYCLE */}
      {reportType === 'MEMBERSHIPS' && (
        <div className="space-y-6">
          {isMembershipsLoading ? (
            <LoadingState message="Fetching membership status distribution..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">
                    Membership Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={membershipsData?.data?.distribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                          label
                        >
                          {membershipsData?.data?.distribution?.map(
                            (_: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                            color: '#0f172a',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">
                    Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {membershipsData?.data?.distribution?.map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-sm"
                      >
                        <span className="font-semibold text-slate-800">
                          {item.status}
                        </span>
                        <span className="font-bold text-amber-700">
                          {item.count} Memberships
                        </span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
