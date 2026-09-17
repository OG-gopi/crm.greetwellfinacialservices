import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  Check
} from 'lucide-react';
import { api } from '../../services/api';

export const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Extract token from URL search query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam.trim());
    } else {
      setError('Password reset token is missing from the link. Please request a new password reset.');
    }
  }, [location.search]);

  // Password Validation Checklist Rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const validCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'None', color: 'bg-slate-700', text: 'text-slate-400', width: 'w-0' };
    if (validCount <= 2) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: 'w-1/4' };
    if (validCount <= 3) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: 'w-2/4' };
    if (validCount <= 4) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (validCount < 4) {
      setError('Password does not meet the security strength requirements. Please ensure it satisfies at least 4 checklist criteria.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });

      if (res.data.success) {
        setSuccess(true);
      } else {
        setError(res.data.message || 'Failed to update password. The link may have expired.');
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        setError(serverMessage || 'This password reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(serverMessage || 'Server error occurred while resetting password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-2xl backdrop-blur-md mb-4 inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Greetwell Financial Services"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">
            Greetwell Financial Services
          </h2>
          <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase mt-1">
            Empowering Dreams • Securing Futures
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10 backdrop-blur-md">
          {success ? (
            /* Success State */
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your Greetwell account password has been updated. You can now log in using your new credentials.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  to="/email-login"
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Form State */
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center p-2.5 bg-amber-500/10 rounded-xl text-amber-400 mb-2 border border-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-white tracking-wide uppercase">
                  Set New Password
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create a secure new password for your GFS account.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Progress Bar */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={strength.text}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Password Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-400">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-semibold' : ''}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400 font-semibold' : ''}`}>
                      {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>One uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400 font-semibold' : ''}`}>
                      {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>One lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400 font-semibold' : ''}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>One number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400 font-semibold' : ''}`}>
                      {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>Special character</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400 font-semibold' : ''}`}>
                      {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Set New Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs">
            <Link
              to="/email-login"
              className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500 font-medium">
          © {new Date().getFullYear()} Greetwell Financial Services. All rights reserved.
        </p>
      </div>
    </div>
  );
};
export default SetPassword;
