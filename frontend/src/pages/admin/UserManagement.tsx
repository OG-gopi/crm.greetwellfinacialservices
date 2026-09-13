import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Power, RefreshCw, Trash2, Send, MailCheck, ShieldCheck, Users, Mail, UserCheck, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect, SelectOption } from '../../components/common/SearchableSelect';

interface InvitationItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  expiresAt: string;
  invitedByUser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export const UserManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [viewTab, setViewTab] = useState<'USERS' | 'INVITATIONS'>('USERS');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [pageUsers, setPageUsers] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Action states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);

  const [selectedInvitation, setSelectedInvitation] = useState<InvitationItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchUsers = async (pageToFetch = 1, isInitial = false) => {
    if (isInitial) setLoadingUsers(true);
    else setLoadingMoreUsers(true);

    try {
      let url = `/users?search=${encodeURIComponent(search)}&page=${pageToFetch}&limit=15`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        const fetchedList = res.data.data || [];
        if (isInitial) {
          setUsers(fetchedList);
        } else {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newUnique = fetchedList.filter((u: User) => !existingIds.has(u.id));
            return [...prev, ...newUnique];
          });
        }

        if (res.data.pagination) {
          setHasMoreUsers(pageToFetch < (res.data.pagination.totalPages || 1));
        } else {
          setHasMoreUsers(fetchedList.length === 15);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingMoreUsers(false);
    }
  };

  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const res = await api.get('/users/invitations');
      if (res.data.success) {
        setInvitations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (viewTab === 'USERS') {
      setPageUsers(1);
      fetchUsers(1, true);
    } else {
      fetchInvitations();
    }
  }, [viewTab, search, roleFilter, statusFilter]);

  const handleLoadMoreUsers = () => {
    if (!loadingUsers && !loadingMoreUsers && hasMoreUsers) {
      const nextPage = pageUsers + 1;
      setPageUsers(nextPage);
      fetchUsers(nextPage, false);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/users/${targetUser.id}/status`, { status: newStatus });
      showSuccess(`Account for ${targetUser.email} marked as ${newStatus}.`);
      fetchUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleOpenEdit = (targetUser: User) => {
    setSelectedUser(targetUser);
    setEditForm({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName || '',
      phone: targetUser.phone || '',
      role: targetUser.role,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      showSuccess(`Updated user details for ${selectedUser.email}.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvitation = async (inv: InvitationItem) => {
    setResendingId(inv.id);
    try {
      const res = await api.post(`/users/invitations/${inv.id}/resend`);
      if (res.data.success) {
        showSuccess(`Invitation email successfully resent to ${inv.email}.`);
        fetchInvitations();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to resend invitation email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleConfirmCancelInvitation = async () => {
    if (!selectedInvitation) return;
    setCanceling(true);
    try {
      const res = await api.delete(`/users/invitations/${selectedInvitation.id}`);
      if (res.data.success) {
        showSuccess(`Invitation for ${selectedInvitation.email} has been canceled.`);
        setIsCancelModalOpen(false);
        fetchInvitations();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to cancel invitation.');
    } finally {
      setCanceling(false);
    }
  };

  // Filtered Invitations
  const filteredInvitations = invitations.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (inv.email && inv.email.toLowerCase().includes(q)) ||
      (inv.firstName && inv.firstName.toLowerCase().includes(q)) ||
      (inv.lastName && inv.lastName.toLowerCase().includes(q)) ||
      (inv.phone && inv.phone.toLowerCase().includes(q));
    const matchRole = !roleFilter || inv.role === roleFilter;
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const roleOptions: SelectOption[] = [
    { value: '', label: 'All Roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'LOAN_AGENT', label: 'Loan Agent' },
    { value: 'INSURANCE_AGENT', label: 'Insurance Agent' },
    { value: 'INVESTMENT_AGENT', label: 'Investment Agent' },
    { value: 'CUSTOMER', label: 'Customer' },
  ];

  const statusOptions: SelectOption[] =
    viewTab === 'USERS'
      ? [
          { value: '', label: 'All Statuses' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
        ]
      : [
          { value: '', label: 'All Statuses' },
          { value: 'INVITATION_SENT', label: 'Invitation Sent' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'EXPIRED', label: 'Expired' },
          { value: 'FAILED', label: 'Failed Delivery' },
        ];

  return (
    <div className="space-y-6 font-['Inter',sans-serif]">
      
      {/* PAGE TITLE & VIEW SWITCHER TAB HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            View active users, search roles, monitor invitations, and manage permissions
          </p>
        </div>

        {/* View Tab Switcher Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setViewTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewTab === 'USERS'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Active Users ({users.length})</span>
          </button>
          <button
            onClick={() => setViewTab('INVITATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewTab === 'INVITATIONS'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Pending Invitations ({invitations.length})</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR & SEARCHABLE DROPDOWNS FILTER CARD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <SearchableSelect
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="All Roles"
            searchPlaceholder="Search roles..."
            className="w-full sm:w-44"
          />

          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status..."
            className="w-full sm:w-44"
          />
        </div>
      </div>

      {/* USER TABLE DATA CARD */}
      {viewTab === 'USERS' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-5">USER</th>
                  <th className="py-4 px-5">ROLE</th>
                  <th className="py-4 px-5">PHONE</th>
                  <th className="py-4 px-5">STATUS</th>
                  <th className="py-4 px-5">JOINED DATE</th>
                  <th className="py-4 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Loading users list...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No users matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.firstName} {u.lastName}</p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{u.email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100/90 text-purple-700 border border-purple-200/80'
                              : 'bg-blue-100/90 text-blue-700 border border-blue-200/80'
                          }`}
                        >
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-semibold">{u.phone || 'N/A'}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100/90 text-emerald-700 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                          title="Edit User"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            u.status === 'ACTIVE'
                              ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <LazyLoadTrigger
            onLoadMore={handleLoadMoreUsers}
            hasMore={hasMoreUsers}
            isLoading={loadingMoreUsers}
            totalItems={users.length}
            endMessage="You're all caught up."
          />
        </div>
      ) : (
        /* PENDING INVITATIONS TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-5">INVITED PERSON</th>
                  <th className="py-4 px-5">ROLE</th>
                  <th className="py-4 px-5">STATUS</th>
                  <th className="py-4 px-5">SENT DATE</th>
                  <th className="py-4 px-5">EXPIRY DATE</th>
                  <th className="py-4 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loadingInvitations ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Loading pending invitations...
                    </td>
                  </tr>
                ) : filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No pending invitations matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {inv.firstName ? `${inv.firstName} ${inv.lastName || ''}` : 'Invited User'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{inv.email}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            inv.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100/90 text-purple-700 border border-purple-200/80'
                              : 'bg-blue-100/90 text-blue-700 border border-blue-200/80'
                          }`}
                        >
                          {inv.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === 'INVITATION_SENT' || inv.status === 'PENDING'
                              ? 'bg-amber-100/90 text-amber-800 border border-amber-200/80'
                              : inv.status === 'FAILED'
                              ? 'bg-rose-100/90 text-rose-800 border border-rose-200/80'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                          }`}
                        >
                          {inv.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleResendInvitation(inv)}
                          disabled={resendingId === inv.id}
                          className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{resendingId === inv.id ? 'Resending...' : 'Resend Email'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvitation(inv);
                            setIsCancelModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Information">
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-['Inter',sans-serif]">
          <div>
            <label className="block font-bold text-slate-700 mb-1">User Role</label>
            <SearchableSelect
              options={[
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'LOAN_AGENT', label: 'Loan Agent' },
                { value: 'INSURANCE_AGENT', label: 'Insurance Agent' },
                { value: 'INVESTMENT_AGENT', label: 'Investment Agent' },
                { value: 'CUSTOMER', label: 'Customer' },
              ]}
              value={editForm.role}
              onChange={(val) => setEditForm({ ...editForm, role: val })}
              placeholder="Select Role"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CANCEL INVITATION CONFIRMATION MODAL */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Pending Invitation">
        <div className="space-y-4 text-xs font-['Inter',sans-serif]">
          <p className="text-slate-600 font-medium">
            Are you sure you want to cancel the invitation sent to{' '}
            <strong className="text-slate-900">{selectedInvitation?.email}</strong>? The invitation link will no longer be valid.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCancelInvitation}
              disabled={canceling}
              className="px-5 py-2 bg-rose-600 text-white font-extrabold rounded-xl hover:bg-rose-700 shadow-sm cursor-pointer"
            >
              {canceling ? 'Canceling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
