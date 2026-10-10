'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, Staff } from '@/lib/api/staff.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Award,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function StaffPage() {
  const { currentBranch } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State (Only Name is mandatory per prompt rules)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('Massage Therapist');
  const [specialization, setSpecialization] = useState('Swedish & Deep Tissue Massage');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Fetch Staff
  const { data: staffData, isLoading, error } = useQuery({
    queryKey: ['staff', currentBranch?.id, search],
    queryFn: () =>
      staffApi.getAll({
        branchId: currentBranch?.id,
        search: search || undefined,
      }),
  });

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => staffApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create staff member.');
    },
  });

  // Deactivate Staff Mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPosition('Massage Therapist');
    setSpecialization('Swedish & Deep Tissue Massage');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Staff name is required.');
      return;
    }

    createMutation.mutate({
      branchId: currentBranch?.id,
      name: name.trim(),
      phone: phone || undefined,
      email: email || undefined,
      position: position || undefined,
      specialization: specialization || undefined,
      joiningDate: joiningDate ? new Date(joiningDate).toISOString() : undefined,
      notes: notes || undefined,
    });
  };

  const staffList = staffData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Spa Therapists"
        description="Manage branch personnel, therapist specializations, and service delivery performance"
      >
        <Button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          variant="gold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search staff by name, phone, role..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <LoadingState message="Loading staff directory..." />
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>Error loading staff members.</span>
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No staff members registered"
          description="Add your team of massage therapists, aestheticians, and reception staff."
          action={
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="gold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Staff Member
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staffList.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {member.staffCode}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-0.5">{member.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{member.position}</p>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                {member.specialization && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80">
                    <Award className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    <span className="truncate">{member.specialization}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}

                  {member.joiningDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Joined {new Date(member.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[11px] text-slate-500 font-medium">Treatments Done</span>
                    <span className="font-bold text-slate-800">
                      {member._count?.visitServices || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-200">
                    <span className="block text-[11px] text-slate-500 font-medium">Bookings</span>
                    <span className="font-bold text-slate-800">
                      {member._count?.appointments || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-3 border-t border-slate-100 text-xs">
                {member.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deactivateMutation.mutate(member.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Staff Member"
          size="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name * (Required)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Santos"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone (Indian Mobile)
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@blish-spa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Position / Role
                </label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Senior Aesthetician"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Specialization
                </label>
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Aromatherapy & Hot Stone"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Joining Date
              </label>
              <Input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Certifications, shift preferences, emergency contacts..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                variant="gold"
              >
                {createMutation.isPending ? 'Saving...' : 'Add Staff Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
