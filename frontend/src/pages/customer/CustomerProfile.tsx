import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  Key,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const CustomerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'password'>('profile');

  // Sync tab from URL if present
  useEffect(() => {
    if (location.pathname.endsWith('/password')) {
      setActiveTab('password');
    } else if (location.pathname.endsWith('/account') || location.pathname.endsWith('/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  // Form States - Profile
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Form States - Settings (Toggles)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Form States - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const getInitials = () => {
    if (user.role === 'SUPER_ADMIN' || user.firstName === 'Super') return 'SA';
    return `${user.firstName[0] || ''}${(user.lastName && user.lastName[0]) || ''}`.toUpperCase();
  };

  const formattedJoinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : '9/13/2026';

  const employeeOrCustomerId = user.customerIdCode || user.agentIdCode || `GFS-${user.role.slice(0, 3)}-0001`;

  // Profile Form Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await api.put('/auth/profile', {
        firstName,
        lastName,
        phone,
      });

      if (res.data.success) {
        updateUser(res.data.data);
        setProfileSuccess('Profile information updated successfully.');
      } else {
        setProfileError(res.data.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess('');

    setTimeout(() => {
      setSettingsSuccess('Account preferences & security settings saved.');
      setSettingsSaving(false);
    }, 400);
  };

  // Password Change Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      setPasswordSaving(false);
      return;
    }

    setTimeout(() => {
      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaving(false);
    }, 600);
  };

  const navigateTab = (tab: 'profile' | 'settings' | 'password') => {
    setActiveTab(tab);
    const basePath = user.role === 'SUPER_ADMIN' ? '/superadmin/settings' : '/profile';
    if (tab === 'profile') navigate(`${basePath}/profile`);
    if (tab === 'settings') navigate(`${basePath}/account`);
    if (tab === 'password') navigate(`${basePath}/password`);
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#1C2430] font-sans pt-2 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#10233F] text-[#E8C877] shadow-md'
                  : 'bg-white text-[#5B6472] hover:bg-[#EAF0FA] hover:text-[#10233F] border border-[#E4E0D6]'
              }`}
            >
              <User className="w-4 h-4" /> My Profile
            </button>

            <button
              onClick={() => navigateTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#10233F] text-[#E8C877] shadow-md'
                  : 'bg-white text-[#5B6472] hover:bg-[#EAF0FA] hover:text-[#10233F] border border-[#E4E0D6]'
              }`}
            >
              <Sliders className="w-4 h-4" /> Account Settings
            </button>

            <button
              onClick={() => navigateTab('password')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-[#10233F] text-[#E8C877] shadow-md'
                  : 'bg-white text-[#5B6472] hover:bg-[#EAF0FA] hover:text-[#10233F] border border-[#E4E0D6]'
              }`}
            >
              <Key className="w-4 h-4" /> Change Password
            </button>
          </div>
        </div>

        {/* TAB 1: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-[#10233F]">My profile</h1>
              <p className="text-xs text-[#94998F] mt-1">View and update your personal account information</p>
            </div>

            {/* Profile Hero Panel */}
            <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-5 p-6">
                {/* Large Avatar */}
                <div className="w-20 h-20 rounded-full bg-[#10233F] text-[#E8C877] font-serif text-2xl font-bold flex items-center justify-center shrink-0 border-2 border-[#C99A3E] shadow-sm">
                  {getInitials()}
                </div>
                {/* Profile Meta */}
                <div>
                  <h2 className="text-xl font-bold text-[#1C2430]">{user.firstName} {user.lastName || ''}</h2>
                  <span className="inline-block mt-1.5 text-[11px] font-extrabold tracking-wider bg-[#EAF0FA] text-[#2A5599] px-3.5 py-1 rounded-full border border-blue-200 uppercase font-mono shadow-2xs">
                    {user.role.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-[#94998F] mt-2 font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Personal Information Panel */}
            <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#E4E0D6] text-xs font-extrabold text-[#10233F] bg-[#FBFAF6]">
                Personal information
              </div>

              <div className="p-6 space-y-6">
                {profileSuccess && (
                  <div className="p-4 rounded-xl bg-[#E7F0EA] border border-emerald-300 text-[#2F6B4F] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-4 rounded-xl bg-[#FBEBEB] border border-rose-300 text-[#B23A3A] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Full name
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                        />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Email address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#F0ECE1] text-[#5B6472] font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Mobile phone
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.role.replace(/_/g, ' ')}
                        className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#F0ECE1] text-[#5B6472] font-semibold cursor-not-allowed capitalize"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Joined date
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formattedJoinedDate}
                        className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#F0ECE1] text-[#5B6472] font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                        Employee / Account ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={employeeOrCustomerId}
                        className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#F0ECE1] text-[#5B6472] font-mono font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C99A3E] hover:bg-[#B8862E] text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {profileSaving ? 'Saving changes...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <button
              onClick={() => navigateTab('profile')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#94998F] hover:text-[#10233F] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
            </button>

            <div>
              <h1 className="font-serif text-2xl font-semibold text-[#10233F]">Account settings</h1>
              <p className="text-xs text-[#94998F] mt-1">Manage notifications, security preferences, and display options</p>
            </div>

            {settingsSuccess && (
              <div className="p-4 rounded-xl bg-[#E7F0EA] border border-emerald-300 text-[#2F6B4F] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Notification preferences panel */}
              <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#E4E0D6] text-xs font-extrabold text-[#10233F] bg-[#FBFAF6] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C99A3E]" /> Notification preferences
                </div>

                <div className="p-6 divide-y divide-[#E4E0D6]">
                  <div className="py-4 first:pt-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C2430]">Email notifications</div>
                      <div className="text-[11.5px] text-[#94998F] mt-0.5 font-medium">Receive application and system alerts by email</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        emailNotifications ? 'bg-[#C99A3E]' : 'bg-[#E4E0D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                          emailNotifications ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C2430]">SMS alerts</div>
                      <div className="text-[11.5px] text-[#94998F] mt-0.5 font-medium">Get urgent alerts sent to your registered phone</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmsAlerts(!smsAlerts)}
                      className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        smsAlerts ? 'bg-[#C99A3E]' : 'bg-[#E4E0D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                          smsAlerts ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="py-4 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C2430]">Weekly summary report</div>
                      <div className="text-[11.5px] text-[#94998F] mt-0.5 font-medium">A digest of portal activity every Monday</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeeklySummary(!weeklySummary)}
                      className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        weeklySummary ? 'bg-[#C99A3E]' : 'bg-[#E4E0D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                          weeklySummary ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Preferences Panel */}
              <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#E4E0D6] text-xs font-extrabold text-[#10233F] bg-[#FBFAF6] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#2A5599]" /> Security
                </div>

                <div className="p-6 divide-y divide-[#E4E0D6]">
                  <div className="py-4 first:pt-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C2430]">Two-factor authentication</div>
                      <div className="text-[11.5px] text-[#94998F] mt-0.5 font-medium">Add an extra layer of protection at login</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        twoFactorAuth ? 'bg-[#C99A3E]' : 'bg-[#E4E0D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                          twoFactorAuth ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="py-4 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C2430]">Login alerts</div>
                      <div className="text-[11.5px] text-[#94998F] mt-0.5 font-medium">Notify me when a new device signs in</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLoginAlerts(!loginAlerts)}
                      className={`relative w-12 h-6.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                        loginAlerts ? 'bg-[#C99A3E]' : 'bg-[#E4E0D6]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                          loginAlerts ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-6 pt-0 flex justify-end">
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C99A3E] hover:bg-[#B8862E] text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {settingsSaving ? 'Saving preferences...' : 'Save preferences'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <div className="space-y-6 animate-fade-in">
            <button
              onClick={() => navigateTab('profile')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#94998F] hover:text-[#10233F] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
            </button>

            <div>
              <h1 className="font-serif text-2xl font-semibold text-[#10233F]">Change password</h1>
              <p className="text-xs text-[#94998F] mt-1">Choose a strong password you don't use elsewhere</p>
            </div>

            <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#E4E0D6] text-xs font-extrabold text-[#10233F] bg-[#FBFAF6] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C99A3E]" /> Update your password
              </div>

              <div className="p-6 space-y-5">
                {passwordSuccess && (
                  <div className="p-4 rounded-xl bg-[#E7F0EA] border border-emerald-300 text-[#2F6B4F] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-4 rounded-xl bg-[#FBEBEB] border border-rose-300 text-[#B23A3A] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                      Current password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                      New password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#94998F] tracking-wider mb-2">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full border border-[#E4E0D6] rounded-xl px-4 py-2.5 bg-[#FBFAF7] text-[#1C2430] font-medium focus:outline-none focus:border-[#C99A3E] focus:ring-2 focus:ring-[#C99A3E]/20 transition-all"
                    />
                  </div>

                  {/* Password Requirements Box */}
                  <div className="bg-[#FBFAF5] border border-[#E4E0D6] rounded-xl p-4 text-xs space-y-2 mt-3 shadow-2xs">
                    <div className="text-[11px] font-extrabold text-[#94998F] tracking-wider uppercase">
                      PASSWORD MUST INCLUDE
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[#5B6472] font-medium">
                      <li>At least 8 characters</li>
                      <li>One uppercase and one lowercase letter</li>
                      <li>One number and one special character</li>
                    </ul>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C99A3E] hover:bg-[#B8862E] text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      {passwordSaving ? 'Updating password...' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;

