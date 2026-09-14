import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  UserPlus,
  Building2,
  CheckCircle,
  HelpCircle,
  KeyRound,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GFSBrandHeader } from '../../components/common/GFSBrandHeader';
import { PORTAL_VERSION_DISPLAY } from '../../config/version';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedSuccessMsg, setVerifiedSuccessMsg] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Check URL search parameters for prefilled email & email verification status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const verifiedParam = params.get('verified');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (verifiedParam === 'true') {
      setVerifiedSuccessMsg('Email address verified successfully! Please enter your password to sign in.');
    }
  }, [location.search]);

  const formatLoginError = (err: any): string => {
    if (!err.response) {
      return 'Backend service unavailable. Please verify internet connection or backend server status.';
    }
    const status = err.response.status;
    const serverMessage = typeof err.response.data?.message === 'string' ? err.response.data.message : null;

    if (status === 404) {
      return 'API route not found (404). Please ensure the backend login endpoint is configured correctly.';
    }
    if (status === 401 || status === 400) {
      return serverMessage || 'Invalid email address or password. Please try again.';
    }
    if (status === 500 || status === 503) {
      if (serverMessage && (serverMessage.toLowerCase().includes('database') || serverMessage.toLowerCase().includes('prisma') || serverMessage.toLowerCase().includes('db'))) {
        return `Database error: ${serverMessage}`;
      }
      return serverMessage || 'Backend server error (500). Please try again later or contact support.';
    }
    return serverMessage || `Login request failed with status ${status}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Unified Common Login Request without role restrictions
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        // Role-Based Automatic Redirection
        switch (user.role) {
          case 'SUPER_ADMIN':
            navigate('/superadmin/dashboard', { replace: true });
            break;
          case 'LOAN_AGENT':
            navigate('/loan-agent/dashboard', { replace: true });
            break;
          case 'INSURANCE_AGENT':
            navigate('/insurance-agent/dashboard', { replace: true });
            break;
          case 'INVESTMENT_AGENT':
            navigate('/investment-agent/dashboard', { replace: true });
            break;
          case 'CUSTOMER':
            navigate('/customer/dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      setError(formatLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setShowPresets(false);
  };

  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (document.referrer && document.referrer.startsWith('http') && !document.referrer.includes('/login')) {
      window.location.href = document.referrer;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#051124] via-[#091a34] to-[#030914] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Main Split-Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-950/60 overflow-hidden flex flex-col md:flex-row border border-slate-800/80 min-h-[580px]">
        
        {/* LEFT PANEL: Executive GFS Brand Showcase */}
        <div className="w-full md:w-[42%] bg-[#08152b] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Subtle Radial Glow & Overlay */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unified Portal Gateway</span>
            </div>
          </div>

          {/* Center Brand Pillars */}
          <div className="relative z-10 my-auto py-8 space-y-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                Greetwell Financial Services
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
                Single unified access portal for Super Admin, Agents, and Valued Customers.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Loans & Mortgages</h4>
                  <p className="text-[11px] text-slate-400">Personal, Home & Business Loan Solutions</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Comprehensive Insurance</h4>
                  <p className="text-[11px] text-slate-400">Life, Health & Property Protection</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Wealth & Investments</h4>
                  <p className="text-[11px] text-slate-400">Mutual Funds, FDs & Smart Advisory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
            </span>
            <span className="font-bold text-slate-300">GFS Portal v2.0</span>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Form Card */}
        <div className="flex-1 bg-white text-slate-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between w-full z-10">
          <div className="max-w-md mx-auto w-full">
            {/* GFS Brand Header Logo */}
            <GFSBrandHeader size="lg" variant="card" />

            {/* Title & Description */}
            <div className="text-center mt-4 mb-6">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Please enter your credentials to access your portal account
              </p>
            </div>

            {/* Verification Success Alert */}
            {verifiedSuccessMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{verifiedSuccessMsg}</span>
              </div>
            )}

            {/* Error Alert Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center shadow-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email / Mobile Number Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Email Address / Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="Enter email or 10-digit mobile number"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center pt-1">
                <label className="flex items-center text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2 cursor-pointer"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Sign In Primary Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl shadow-md shadow-blue-900/20 font-extrabold text-white bg-[#08152b] hover:bg-[#050e1e] active:bg-[#030812] focus:outline-none transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="h-4 w-4" />
                    <span>Sign In to Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Customer Sign Up Option */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                New Customer?{' '}
                <Link
                  to="/customer/register"
                  className="text-emerald-700 hover:text-emerald-800 font-extrabold hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Sign Up for Customer Account
                </Link>
              </p>
            </div>

            {/* Back to Home Button */}
            <div className="mt-3 text-center">
              <a
                href="/"
                onClick={handleBackToHome}
                className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </a>
            </div>

            {/* Quick Fill Credentials Seed Helper */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {showPresets ? 'Hide Demo Presets' : 'Quick Fill Demo Credentials'}
              </button>

              {showPresets && (
                <div className="mt-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('gopikrishnabeesu@gmail.com', 'Data@1234')}
                    className="w-full p-2 bg-slate-900 text-white rounded-xl font-mono text-[11px] flex justify-between items-center hover:bg-slate-800 transition-all"
                  >
                    <span>Super Admin: gopikrishnabeesu@gmail.com</span>
                    <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('loan.agent@greetwell.com', 'Agent@123456')}
                    className="w-full p-2 bg-blue-900 text-white rounded-xl font-mono text-[11px] flex justify-between items-center hover:bg-blue-800 transition-all"
                  >
                    <span>Loan Agent: loan.agent@greetwell.com</span>
                    <span className="text-blue-300 font-bold bg-blue-300/10 px-2 py-0.5 rounded">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('john.doe@example.com', 'Customer@123456')}
                    className="w-full p-2 bg-emerald-900 text-white rounded-xl font-mono text-[11px] flex justify-between items-center hover:bg-emerald-800 transition-all"
                  >
                    <span>Customer: john.doe@example.com</span>
                    <span className="text-emerald-300 font-bold bg-emerald-300/10 px-2 py-0.5 rounded">Fill</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Line with Version */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium max-w-md mx-auto w-full">
            <span>© {new Date().getFullYear()} Greetwell Financial Services.</span>
            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {PORTAL_VERSION_DISPLAY}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
