import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Crown, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GFSBrandHeader } from '../../components/common/GFSBrandHeader';

export const SuperAdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    api.get('/system/settings')
      .then((res) => {
        const ver = res.data.data?.find((s: any) => s.key === 'VERSION')?.value;
        if (ver) setVersion(ver);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { 
        email, 
        password,
        requiredRole: 'SUPER_ADMIN' 
      });
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/superadmin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Super Admin login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Card Container Matching Reference Card 1 */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 min-h-[580px]">
        
        {/* LEFT PANEL: Dark Navy with Crown Icon */}
        <div className="w-full md:w-64 lg:w-72 bg-[#091526] text-white p-8 sm:p-10 flex flex-col justify-between items-center text-center z-10 shrink-0">
          <div className="my-auto flex flex-col items-center">
            {/* Crown Icon */}
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Crown className="w-10 h-10 fill-amber-400/20" />
            </div>

            {/* Panel Title */}
            <h2 className="text-xl font-bold tracking-tight text-white">
              Super Admin Login
            </h2>

            {/* Yellow Accent Bar */}
            <div className="w-10 h-1 bg-amber-400 my-4 rounded-full" />

            {/* Description Subtext */}
            <p className="text-xs text-slate-300 leading-relaxed max-w-[200px] font-medium">
              Manage Users, Agents, Customers and Entire Portal
            </p>
          </div>

          <div className="pt-4 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Executive Security Shield
          </div>
        </div>

        {/* CENTER PANEL: White Login Card */}
        <div className="flex-1 bg-white text-slate-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between max-w-md mx-auto w-full z-10">
          <div>
            {/* GFS Brand Header */}
            <GFSBrandHeader accentColor="navy" />

            {/* Title & Subtitle */}
            <div className="text-center mt-3 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Super Admin Portal
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sign in to manage the entire GFS portal
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Remember & Forgot Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mr-2"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>

              {/* Action Button Matching Reference */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl shadow-lg font-bold text-white bg-[#0a182e] hover:bg-[#071120] active:bg-[#040b15] focus:outline-none transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>{loading ? 'Signing In...' : 'Sign In to Admin Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Demo Preset Toggle */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {showPresets ? 'Hide Seed Helper' : 'Fill Super Admin Credentials'}
              </button>

              {showPresets && (
                <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('gopikrishnabeesu@gmail.com', 'Data@1234')}
                    className="w-full p-2 bg-slate-900 text-white rounded font-mono text-[11px] flex justify-between items-center"
                  >
                    <span>gopikrishnabeesu@gmail.com</span>
                    <span className="text-amber-400 font-bold">Auto Fill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@greetwell.com', 'Admin@123456')}
                    className="w-full p-2 bg-slate-800 text-slate-200 rounded font-mono text-[11px] flex justify-between items-center"
                  >
                    <span>admin@greetwell.com</span>
                    <span className="text-slate-400 font-bold">Legacy</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Line Matching Reference */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>© 2024 Greetwell Financial Services. All rights reserved.</span>
            <span className="font-mono">Version {version}</span>
          </div>
        </div>

        {/* RIGHT PANEL: Executive Mountain Sunrise Hero Visual */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0c1c38] via-[#081224] to-[#040912] p-10 flex-col justify-between text-white border-l border-slate-800">
          {/* Background Atmospheric Mountain & Sunrise Artwork */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80')`
            }}
          />

          {/* Subtle Sun Glow Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#081224] via-[#081224]/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081224] via-transparent to-[#081224]/40 pointer-events-none" />

          {/* Silhouette Overlay of Executive Standing on Peak */}
          <div className="absolute right-12 bottom-10 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 200" className="h-64 w-auto fill-slate-950">
              <path d="M50,20 C56,20 60,16 60,10 C60,4 56,0 50,0 C44,0 40,4 40,10 C40,16 44,20 50,20 Z M65,30 L35,30 C30,30 25,35 25,40 L25,90 L35,90 L35,190 L48,190 L48,120 L52,120 L52,190 L65,190 L65,90 L75,90 L75,40 C75,35 70,30 65,30 Z" />
            </svg>
          </div>

          {/* Top Right Header Text Overlay Matching Reference */}
          <div className="z-10 text-right space-y-0.5">
            <p className="text-[11px] font-serif tracking-[0.25em] text-slate-200 uppercase font-semibold">
              STRONGER SYSTEMS
            </p>
            <p className="text-[11px] font-serif tracking-[0.25em] text-slate-200 uppercase font-semibold">
              BRIGHTER TOMORROWS
            </p>
          </div>

          {/* Center Brand Statement Overlay Matching Reference */}
          <div className="z-10 my-auto space-y-1 pl-4 border-l-2 border-amber-400/60 max-w-md">
            <span className="text-xl font-serif text-white tracking-widest block font-bold">
              EMPOWERING
            </span>
            <span className="text-3xl sm:text-4xl font-serif text-amber-400 tracking-widest block font-black drop-shadow-md">
              DREAMS
            </span>
            <span className="text-3xl sm:text-4xl font-serif text-amber-400 tracking-widest block font-black drop-shadow-md">
              SECURING
            </span>
            <span className="text-3xl sm:text-4xl font-serif text-amber-400 tracking-widest block font-black drop-shadow-md">
              FUTURES
            </span>

            <div className="text-[11px] font-sans font-bold tracking-[0.2em] text-slate-200 pt-3 border-t border-amber-400/40 mt-4 block uppercase">
              LOANS &nbsp;|&nbsp; INSURANCE &nbsp;|&nbsp; INVESTMENTS
            </div>
          </div>

          {/* Bottom Security Callout */}
          <div className="z-10 text-xs text-slate-400 font-serif italic">
            &ldquo;Governance, Security & Full Portal Command&rdquo;
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminLogin;
