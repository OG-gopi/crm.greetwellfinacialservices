import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Key,
  Sliders,
  Sun,
  Moon,
  Menu,
  Shield,
  Briefcase,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { GFSLogo } from './GFSLogo';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = () => {
    if (user.role === 'SUPER_ADMIN' || user.firstName === 'Super') return 'SA';
    return `${user.firstName[0] || ''}${(user.lastName && user.lastName[0]) || ''}`.toUpperCase();
  };

  // Time-based Greeting & Icon
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { prefix: 'Good Morning', isDay: true };
    if (hour >= 12 && hour < 17) return { prefix: 'Good Afternoon', isDay: true };
    if (hour >= 17 && hour < 22) return { prefix: 'Good Evening', isDay: false };
    return { prefix: 'Good Night', isDay: false };
  };

  const { prefix: greetingPrefix, isDay } = getGreetingData();

  // Portal Name Badge & Icon
  const getPortalInfo = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { name: 'Super Admin Portal', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield };
      case 'LOAN_AGENT':
        return { name: 'Loan Agent Portal', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard };
      case 'INSURANCE_AGENT':
        return { name: 'Insurance Agent Portal', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: Briefcase };
      case 'INVESTMENT_AGENT':
        return { name: 'Investment Agent Portal', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: TrendingUp };
      case 'CUSTOMER':
        return { name: 'Customer Portal', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: User };
      default:
        return { name: 'Portal Dashboard', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: Shield };
    }
  };

  const portal = getPortalInfo();
  const PortalIcon = portal.icon;

  const getNotificationRoute = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/superadmin/notifications';
      case 'LOAN_AGENT':
        return '/loan-agent/notifications';
      case 'INSURANCE_AGENT':
        return '/insurance-agent/notifications';
      case 'INVESTMENT_AGENT':
        return '/investment-agent/notifications';
      case 'CUSTOMER':
        return '/customer/notifications';
      default:
        return '/notifications';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[96px] w-full items-center bg-white px-4 sm:px-6 border-b border-[#E4E0D6] shadow-xs font-sans flex justify-between">
      {/* Left side: Portal Name & Icon Badge */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer mr-2.5"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="h-5 w-5 stroke-[2.2]" />
        </button>

        <span className={`inline-flex items-center gap-2 text-xs font-extrabold font-mono px-3.5 py-1.5 rounded-xl border shadow-xs ${portal.badge}`}>
          <PortalIcon className="w-4 h-4" />
          {portal.name}
        </span>
      </div>

      {/* Center: Dynamic Time-Based Greeting */}
      <div className="hidden lg:flex items-center justify-center text-xs sm:text-sm font-extrabold text-slate-800">
        {isDay ? (
          <Sun className="w-4 h-4 text-amber-500 mr-1.5 shrink-0 stroke-[2]" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500 mr-1.5 shrink-0 stroke-[2]" />
        )}
        <span>{greetingPrefix},&nbsp;</span>
        <span className="text-[#1d63ed] font-black">{user.firstName} {user.lastName}</span>
      </div>

      {/* Right side: Notifications Bell & Profile Avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notifications Bell Button */}
        <Link
          to={getNotificationRoute()}
          className="relative p-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
          title="Notification Center"
        >
          <Bell className="h-5 w-5 stroke-[2]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 rounded-xl p-1.5 hover:bg-[#F7F5F0] transition-colors cursor-pointer border border-transparent hover:border-[#E4E0D6]"
          >
            {/* Circular Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10233F] font-bold text-[#E8C877] text-xs shadow-sm ring-2 ring-[#C99A3E]/30">
              {getInitials()}
            </div>
            {/* Profile Name & Role */}
            <div className="text-left hidden sm:block">
              <span className="text-xs font-extrabold text-[#1C2430] block leading-none">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-[9.5px] text-[#94998F] font-extrabold uppercase font-mono block mt-1 tracking-wider">
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#94998F] shrink-0 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu matching HTML Design */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-[290px] rounded-xl bg-white shadow-2xl z-50 border border-[#E4E0D6] overflow-hidden animate-fade-in">
              {/* Dropdown Header */}
              <div className="p-6 text-center border-b border-[#E4E0D6] bg-gradient-to-b from-[#FBFAF6] to-white">
                {/* Circular GFS Emblem */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#0A1830] border-2 border-[#C99A3E] shadow-sm flex flex-col items-center justify-center mx-auto mb-3">
                  <span className="font-serif text-base font-bold text-[#E8C877] leading-none">GFS</span>
                  <span className="text-[3.5px] tracking-widest text-white/50 uppercase mt-1">LOAN · INSURANCE · INVESTMENT</span>
                </div>
                <p className="text-[10.5px] text-[#94998F] font-extrabold tracking-wider uppercase mb-1">LOGGED IN ACCOUNT</p>
                <p className="text-sm font-bold text-[#10233F] truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-[#94998F] truncate mt-0.5">{user.email}</p>
              </div>

              {/* Dropdown Menu Links */}
              <div className="p-2 text-xs space-y-0.5 font-semibold text-[#1C2430]">
                {/* My Profile */}
                <Link
                  to={user.role === 'SUPER_ADMIN' ? '/superadmin/settings/profile' : '/profile'}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F5F0] transition-colors"
                >
                  <User className="w-4 h-4 text-[#2A5599] shrink-0" />
                  <span>My profile</span>
                </Link>

                {/* Account Settings */}
                <Link
                  to={user.role === 'SUPER_ADMIN' ? '/superadmin/settings/account' : '/profile/settings'}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F5F0] transition-colors"
                >
                  <Sliders className="w-4 h-4 text-[#2A5599] shrink-0" />
                  <span>Account settings</span>
                </Link>

                {/* Change Password */}
                <Link
                  to={user.role === 'SUPER_ADMIN' ? '/superadmin/settings/password' : '/profile/password'}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F7F5F0] transition-colors"
                >
                  <Key className="w-4 h-4 text-[#C99A3E] shrink-0" />
                  <span>Change password</span>
                </Link>

                <div className="my-1.5 border-t border-[#E4E0D6]" />

                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#B23A3A] hover:bg-[#FBEBEB] font-extrabold text-left cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-[#B23A3A] shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
