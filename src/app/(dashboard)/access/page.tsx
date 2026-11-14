'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccessPermission, AccessRole, usersApi } from '@/lib/api/users.api';
import { branchesApi } from '@/lib/api/branches.api';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { Shield, Plus, Trash2 } from 'lucide-react';

const MODULES: { key: string; label: string }[] = [
  { key: 'customer', label: 'Guests' },
  { key: 'membership', label: 'Memberships' },
  { key: 'visit', label: 'Visits & check-in' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'service', label: 'Services' },
  { key: 'plan', label: 'Plans' },
  { key: 'staff', label: 'Staff' },
  { key: 'payment', label: 'Payments' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'report', label: 'Reports' },
  { key: 'branch', label: 'Branches' },
  { key: 'user', label: 'Logins & roles' },
  { key: 'settings', label: 'Settings' },
  { key: 'audit', label: 'Audit trail' },
];

const ACTIONS = ['read', 'write', 'delete'] as const;

function idsFor(permissions: AccessPermission[], module: string, action: string) {
  return permissions.filter((item) => item.module === module && item.action === action).map((item) => item.id);
}

export default function AccessPage() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission('user.create');
  const canUpdate = hasPermission('user.update');
  const canDelete = hasPermission('user.delete');

  const [roleId, setRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [roleError, setRoleError] = useState('');
  const [roleMessage, setRoleMessage] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [nextPassword, setNextPassword] = useState('');
  const [accountError, setAccountError] = useState('');

  const { data: permissionsRes, isLoading: permissionsLoading } = useQuery({
    queryKey: ['access-permissions'],
    queryFn: () => usersApi.getPermissions(),
  });
  const { data: rolesRes, isLoading: rolesLoading } = useQuery({
    queryKey: ['access-roles'],
    queryFn: () => usersApi.getRoles(),
  });
  const { data: usersRes } = useQuery({
    queryKey: ['access-users'],
    queryFn: () => usersApi.getAll(),
  });
  const { data: branchesRes } = useQuery({
    queryKey: ['access-branches'],
    queryFn: () => branchesApi.getAll({ status: 'ACTIVE' }),
    enabled: isSuperAdmin,
  });

  const permissions = permissionsRes?.data || [];
  const roles = rolesRes?.data || [];
  const users = usersRes?.data || [];
  const assignableRoles = roles.filter((role) => {
    if (role.name === 'SUPER_ADMIN') return false;
    if (isSuperAdmin) return true;
    if (role.name === 'ADMIN') return false;
    return role.rolePermissions.every((item) => hasPermission(item.permission.name));
  });
  const branches = branchesRes?.data || [];

  useEffect(() => {
    if (isSuperAdmin && !branchId && branches.length === 1) {
      setBranchId(branches[0].id);
    }
  }, [isSuperAdmin, branchId, branches]);
  const selectedRole = roles.find((role) => role.id === roleId) || null;
  const locked = Boolean(selectedRole?.isSystem);

  const modules = useMemo(
    () => MODULES.filter((module) => permissions.some((item) => item.module === module.key)),
    [permissions]
  );

  const resetRoleForm = () => {
    setRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setPermissionIds([]);
    setRoleError('');
    setRoleMessage('');
  };

  const loadRole = (role: AccessRole) => {
    setRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setPermissionIds(role.rolePermissions.map((item) => item.permission.id));
    setRoleError('');
    setRoleMessage('');
  };

  const isChecked = (module: string, action: string) => {
    const ids = idsFor(permissions, module, action);
    return ids.length > 0 && ids.every((id) => permissionIds.includes(id));
  };

  const toggle = (module: string, action: (typeof ACTIONS)[number]) => {
    if (locked) return;
    const target = idsFor(permissions, module, action);
    if (target.length === 0) return;
    const next = new Set(permissionIds);
    const turningOn = target.some((id) => !next.has(id));
    if (turningOn) {
      target.forEach((id) => next.add(id));
      if (action !== 'read') {
        idsFor(permissions, module, 'read').forEach((id) => next.add(id));
      }
    } else {
      target.forEach((id) => next.delete(id));
      if (action === 'read') {
        idsFor(permissions, module, 'write').forEach((id) => next.delete(id));
        idsFor(permissions, module, 'delete').forEach((id) => next.delete(id));
      }
    }
    setPermissionIds([...next]);
  };

  const saveRole = useMutation({
    mutationFn: () => {
      const payload = {
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissionIds,
      };
      return roleId ? usersApi.updateRole(roleId, payload) : usersApi.createRole(payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['access-roles'] });
      setRoleId(res.data.id);
      setRoleMessage(roleId ? 'Role updated.' : 'Role saved. You can now create a login for it.');
      setRoleError('');
      if (!loginRole) setLoginRole(res.data.name);
    },
    onError: (err: Error) => {
      setRoleMessage('');
      setRoleError(err.message || 'Could not save the role.');
    },
  });

  const removeRole = useMutation({
    mutationFn: (id: string) => usersApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-roles'] });
      resetRoleForm();
    },
    onError: (err: Error) => setRoleError(err.message || 'Could not delete the role.'),
  });

  const createLogin = useMutation({
    mutationFn: () =>
      usersApi.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        roleNames: [loginRole],
        branchId: branchId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-users'] });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setLoginError('');
      setLoginMessage('Login created. They can sign in with that email and password.');
      setAccountError('');
    },
    onError: (err: Error) => {
      setLoginMessage('');
      setLoginError(err.message || 'Could not create the login.');
    },
  });

  const changePassword = useMutation({
    mutationFn: ({ id, password: next }: { id: string; password: string }) =>
      usersApi.update(id, { password: next }),
    onSuccess: () => {
      setPasswordUserId(null);
      setNextPassword('');
      setAccountError('');
      setLoginMessage('Password updated. They can sign in with the new password.');
    },
    onError: (err: Error) => setAccountError(err.message || 'Could not change the password.'),
  });

  const removeLogin = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-users'] });
      setAccountError('');
      setLoginMessage('Login removed.');
    },
    onError: (err: Error) => setAccountError(err.message || 'Could not remove the login.'),
  });

  if (permissionsLoading || rolesLoading) {
    return <LoadingState message="Loading roles and permissions..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & access"
        description="Create a role, choose what that person can see, add, edit, or delete, then give them a login."
      >
        {canCreate && (
          <Button variant="gold" onClick={resetRoleForm}>
            <Plus className="w-4 h-4 mr-2" />
            New role
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-[#b5915f]" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => loadRole(role)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                  roleId === role.id
                    ? 'border-[#b5915f] bg-[#fbf7f0]'
                    : 'border-[#e8e0d5] hover:bg-[#fbf9f5]'
                }`}
              >
                <span className="block text-sm font-semibold text-[#2d231c]">{role.name}</span>
                <span className="block text-[11px] text-[#8a7664]">
                  {role.isSystem ? 'Built-in' : `${role.rolePermissions.length} permissions`}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{roleId ? 'Edit role' : 'New role'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Role name"
                value={roleName}
                disabled={locked}
                placeholder="Manager"
                onChange={(e) => setRoleName(e.target.value)}
              />
              <Input
                label="Description"
                value={roleDescription}
                disabled={locked}
                placeholder="Front desk manager"
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e8e0d5]">
              <table className="w-full text-sm">
                <thead className="bg-[#fbf9f5] text-[#5c4a3b]">
                  <tr>
                    <th className="text-left font-semibold px-4 py-2.5">Area</th>
                    <th className="font-semibold px-3 py-2.5">Read</th>
                    <th className="font-semibold px-3 py-2.5">Write</th>
                    <th className="font-semibold px-3 py-2.5">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.key} className="border-t border-[#f0e8dc]">
                      <td className="px-4 py-2.5 font-medium text-[#2d231c]">{module.label}</td>
                      {ACTIONS.map((action) => {
                        const available = idsFor(permissions, module.key, action).length > 0;
                        return (
                          <td key={action} className="text-center px-3 py-2.5">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#b5915f] disabled:opacity-30"
                              checked={available && isChecked(module.key, action)}
                              disabled={!available || locked}
                              aria-label={`${module.label} ${action}`}
                              onChange={() => toggle(module.key, action)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#8a7664]">
              Write covers adding and editing. Delete covers remove, archive, cancel, and refund. Turning on Write or Delete also turns on Read, so the page stays visible. For Logins & roles, Read shows this page, Write lets that person create roles and logins and change a password, and Delete lets them remove a login.
            </p>

            {roleError && <p className="text-sm text-rose-600">{roleError}</p>}
            {roleMessage && <p className="text-sm text-emerald-700">{roleMessage}</p>}

            <div className="flex flex-wrap justify-end gap-2">
              {roleId && !locked && canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-rose-600"
                  disabled={removeRole.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete the ${roleName} role?`)) removeRole.mutate(roleId);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete role
                </Button>
              )}
              {!locked && ((roleId && canUpdate) || (!roleId && canCreate)) && (
                <Button
                  variant="gold"
                  disabled={saveRole.isPending || !roleName.trim()}
                  onClick={() => saveRole.mutate()}
                >
                  {saveRole.isPending ? 'Saving...' : 'Save role'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(canCreate || users.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{canCreate ? 'Logins' : 'Existing logins'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {canCreate && (
            <form
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setLoginError('');
                if (!loginRole) {
                  setLoginError('Choose a role for this login.');
                  return;
                }
                if (isSuperAdmin && !branchId) {
                  setLoginError('Choose the branch this person works at.');
                  return;
                }
                createLogin.mutate();
              }}
            >
              <Input label="First name" value={firstName} required onChange={(e) => setFirstName(e.target.value)} />
              <Input label="Last name" value={lastName} required onChange={(e) => setLastName(e.target.value)} />
              <Input label="Email" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} />
              <Input
                label="Password"
                type="password"
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3e2c1e]">Role</label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[#e2d8ca] bg-white px-3 text-sm text-[#2d231c]"
                >
                  <option value="">Select a role</option>
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3e2c1e]">Branch</label>
                  <select
                    value={branchId}
                    required
                    onChange={(e) => setBranchId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-[#e2d8ca] bg-white px-3 text-sm text-[#2d231c]"
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-3">
                <div>
                  {loginError && <p className="text-sm text-rose-600">{loginError}</p>}
                </div>
                <Button type="submit" variant="gold" disabled={createLogin.isPending}>
                  {createLogin.isPending ? 'Creating...' : 'Create login'}
                </Button>
              </div>
            </form>
            )}

            {accountError && <p className="text-sm text-rose-600">{accountError}</p>}
            {loginMessage && <p className="text-sm text-emerald-700">{loginMessage}</p>}

            {users.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-[#e8e0d5]">
                <table className="w-full text-sm">
                  <thead className="bg-[#fbf9f5] text-[#5c4a3b]">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2.5">Person</th>
                      <th className="text-left font-semibold px-4 py-2.5">Email</th>
                      <th className="text-left font-semibold px-4 py-2.5">Role</th>
                      {(canUpdate || canDelete) && (
                        <th className="text-right font-semibold px-4 py-2.5">Account</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((person) => {
                      const isSelf = person.id === user?.id;
                      const protectedLogin = !isSuperAdmin && (person.roles || []).includes('SUPER_ADMIN');
                      return (
                      <tr key={person.id} className="border-t border-[#f0e8dc]">
                        <td className="px-4 py-2.5 font-medium">
                          {person.firstName} {person.lastName}
                        </td>
                        <td className="px-4 py-2.5 text-[#5c4a3b]">{person.email}</td>
                        <td className="px-4 py-2.5">{(person.roles || []).join(', ') || '—'}</td>
                        {(canUpdate || canDelete) && (
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {canUpdate && !protectedLogin && passwordUserId === person.id && (
                                <>
                                  <Input
                                    type="password"
                                    placeholder="New password"
                                    value={nextPassword}
                                    minLength={6}
                                    onChange={(e) => setNextPassword(e.target.value)}
                                    className="max-w-[180px]"
                                  />
                                  <Button
                                    size="sm"
                                    variant="gold"
                                    disabled={changePassword.isPending || nextPassword.length < 6}
                                    onClick={() => changePassword.mutate({ id: person.id, password: nextPassword })}
                                  >
                                    Save
                                  </Button>
                                </>
                              )}
                              {canUpdate && !protectedLogin && passwordUserId !== person.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setPasswordUserId(person.id);
                                    setNextPassword('');
                                    setAccountError('');
                                  }}
                                >
                                  Change password
                                </Button>
                              )}
                              {canDelete && !isSelf && !protectedLogin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-600"
                                  disabled={removeLogin.isPending}
                                  onClick={() => {
                                    if (window.confirm(`Remove ${person.firstName} ${person.lastName}'s login? They will no longer be able to sign in.`)) {
                                      removeLogin.mutate(person.id);
                                    }
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
