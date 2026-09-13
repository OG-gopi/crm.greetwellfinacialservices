import React, { useState } from 'react';
import { UserManagement } from './UserManagement';
import { VerificationCenter } from './VerificationCenter';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Send } from 'lucide-react';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const UsersManagementSub: React.FC<{ subPage?: string }> = ({ subPage = 'all' }) => {
  const { showSuccess, showError } = useToast();
  const [role, setRole] = useState('SUPER_ADMIN');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [creating, setCreating] = useState(false);

  if (subPage === 'verification') {
    return <VerificationCenter />;
  }

  if (subPage === 'create') {
    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!firstName.trim()) {
        showError('First Name is required.');
        return;
      }
      if (!email.trim()) {
        showError('Email Address is required.');
        return;
      }
      if (!phone.trim()) {
        showError('Phone Number is required.');
        return;
      }

      if (password) {
        if (password.length < 6) {
          showError('Password must be at least 6 characters long.');
          return;
        }
        if (password !== confirmPassword) {
          showError('Passwords do not match.');
          return;
        }
      }

      setCreating(true);
      try {
        if (password) {
          // Direct account creation
          const response = await api.post('/users/create', {
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            email: email.trim(),
            phone: phone.trim(),
            password,
            role,
            status,
          });

          if (response.data.success) {
            showSuccess(response.data.message || 'User account created successfully.');
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            setStatus('ACTIVE');
          }
        } else {
          // Send Invitation Email
          if (role === 'SUPER_ADMIN') {
            await api.post('/users/invite-superadmin', {
              firstName: firstName.trim(),
              lastName: lastName.trim() || undefined,
              email: email.trim(),
              phone: phone.trim(),
            });
            showSuccess(`Super Admin invitation successfully sent to ${email}.`);
          } else if (['LOAN_AGENT', 'INSURANCE_AGENT', 'INVESTMENT_AGENT'].includes(role)) {
            await api.post('/users/create-agent', {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              agentType: role,
            });
            showSuccess(`Agent invitation successfully sent to ${email}.`);
          } else if (role === 'CUSTOMER') {
            await api.post('/users/invite-customer', {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              serviceTypes: ['LOANS'],
            });
            showSuccess(`Customer invitation successfully sent to ${email}.`);
          }
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
        }
      } catch (err: any) {
        showError(err.response?.data?.message || 'Failed to process request.');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs font-['Inter',sans-serif]">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Create / Invite Portal User</h2>
            <p className="text-xs text-slate-500 font-medium">Create Super Admin accounts or invite agents & customers to the portal</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">User Role / Category</label>
            <SearchableSelect
              options={[
                { value: 'SUPER_ADMIN', label: 'Super Admin Executive (Full Access)' },
                { value: 'LOAN_AGENT', label: 'Loan Agent' },
                { value: 'INSURANCE_AGENT', label: 'Insurance Agent' },
                { value: 'INVESTMENT_AGENT', label: 'Investment Agent' },
                { value: 'CUSTOMER', label: 'Customer / Borrower' },
              ]}
              value={role}
              onChange={setRole}
              placeholder="Select User Role"
              className="w-full"
            />
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">First Name *</label>
              <input
                type="text"
                required
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Last Name</label>
              <input
                type="text"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. user@greetwell.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/70 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2 sm:space-y-0">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Password <span className="text-slate-400 font-normal">(Leave blank to send Email Invitation)</span>
              </label>
              <input
                type="password"
                placeholder="Min 6 characters (Optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Account Status */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Initial Account Status</label>
            <SearchableSelect
              options={[
                { value: 'ACTIVE', label: 'Active (Can log in immediately)' },
                { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                { value: 'INACTIVE', label: 'Inactive (Disabled)' },
              ]}
              value={status}
              onChange={setStatus}
              placeholder="Select Account Status"
              className="w-full"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" /> {creating ? 'Processing...' : (password ? 'Create Account Directly' : 'Send Invitation Email')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return <UserManagement />;
};
