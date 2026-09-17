import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const EmailLogin: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract query params: redirect, applicationId, email
  const params = new URLSearchParams(location.search);
  const redirectParam = params.get('redirect') || '';
  const applicationId = params.get('applicationId') || '';
  const emailParam = params.get('email') || '';

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  // Role-based destination resolver
  const resolveTargetDestination = (userRole: string) => {
    let target = '/';

    switch (userRole) {
      case 'SUPER_ADMIN':
        target = applicationId ? `/superadmin/applications` : '/superadmin/dashboard';
        break;
      case 'LOAN_AGENT':
        target = applicationId ? `/loan-agent/applications` : '/loan-agent/dashboard';
        break;
      case 'INSURANCE_AGENT':
        target = applicationId ? `/insurance-agent/applications` : '/insurance-agent/dashboard';
        break;
      case 'INVESTMENT_AGENT':
        target = applicationId ? `/investment-agent/applications` : '/investment-agent/dashboard';
        break;
      case 'CUSTOMER':
      default:
        target = redirectParam.startsWith('/customer') ? redirectParam : '/customer/applications';
        break;
    }

    if (applicationId) {
      const separator = target.includes('?') ? '&' : '?';
      target = `${target}${separator}id=${encodeURIComponent(applicationId)}`;
    }

    return target;
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = resolveTargetDestination(user.role);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success) {
        const { token, user: loggedUser } = res.data.data;
        login(token, loggedUser);

        const targetDestination = resolveTargetDestination(loggedUser.role);
        navigate(targetDestination, { replace: true });
      } else {
        setError(res.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      if (err?.response?.status === 401) {
        setError(serverMessage || 'Invalid email or password. Please try again.');
      } else if (err?.response?.status === 403) {
        setError(serverMessage || 'Account is inactive or pending approval.');
      } else {
        setError(serverMessage || 'Unable to connect to server. Please try again.');
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
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-2xl backdrop-blur-md mb-4 inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Greetwell Financial Services"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback if logo PNG not found
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

        {/* Notice Card for Email Link Referral */}
        <div className="mt-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md text-left">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Secure Email Verification Access
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Please sign in with your Greetwell account to view your application status and financial details securely.
              </p>
              {applicationId && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target Application: {applicationId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10 backdrop-blur-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
                <span className="shrink-0 text-rose-400 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Register here
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
export default EmailLogin;
