import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, UserPlus, Home, Shield, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GFSBrandHeader } from '../../components/common/GFSBrandHeader';

export const CustomerLogin: React.FC = () => {
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
        requiredRole: 'CUSTOMER' 
      });
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Customer login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Card Container Matching Reference Card 3 */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 min-h-[580px]">
        
        {/* LEFT PANEL: Light Blue with User Icon & Badge Pill */}
        <div className="w-full md:w-64 lg:w-72 bg-[#bcdcff] text-slate-900 p-8 sm:p-10 flex flex-col justify-between items-center text-center z-10 shrink-0">
          <div className="my-auto flex flex-col items-center">
            {/* User Icon */}
            <div className="mb-3 p-3 rounded-2xl bg-white/60 text-[#0265dc] border border-blue-300 shadow-sm">
              <User className="w-10 h-10" />
            </div>

            {/* Panel Title */}
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Customer Login
            </h2>

            {/* Blue Accent Bar */}
            <div className="w-10 h-1 bg-[#0265dc] my-4 rounded-full" />

            {/* Description Subtext */}
            <p className="text-xs text-slate-700 leading-relaxed max-w-[200px] font-semibold">
              For Customers Only
            </p>
          </div>

          {/* Bottom Badge Pill Matching Reference */}
          <div className="w-full pt-4">
            <div className="bg-[#93c5fd] text-[#1e3a8a] font-bold text-[11px] rounded-full py-2.5 px-3 text-center shadow-sm">
              Registration Available
            </div>
          </div>
        </div>

        {/* CENTER PANEL: White Login Card */}
        <div className="flex-1 bg-white text-slate-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between max-w-md mx-auto w-full z-10">
          <div>
            {/* GFS Brand Header */}
            <GFSBrandHeader accentColor="blue" />

            {/* Title & Subtitle */}
            <div className="text-center mt-3 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome to GFS
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sign in to your account
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
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0265dc] focus:bg-white transition-all"
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
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0265dc] focus:bg-white transition-all"
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
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0265dc] focus:ring-[#0265dc] mr-2"
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
                className="w-full py-3.5 px-4 rounded-xl shadow-lg font-bold text-white bg-[#0265dc] hover:bg-[#0151b3] active:bg-[#013f8c] focus:outline-none transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Create Account Link Below Button Matching Reference */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Don't have an account?{' '}
                <Link to="/customer/register" className="font-bold text-[#0265dc] hover:underline inline-flex items-center gap-1">
                  Create an account
                </Link>
              </p>
            </div>

            </div>

          {/* Footer Line Matching Reference */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>© 2024 Greetwell Financial Services. All rights reserved.</span>
            <span className="font-mono">Version {version}</span>
          </div>
        </div>

        {/* RIGHT PANEL: Customer Hero Visual Matching Reference */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#e0f0ff] via-[#dbeefc] to-[#c8e3fc] p-10 flex-col justify-between text-slate-900 border-l border-blue-200">
          {/* Customer Background Photo Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-multiply scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#dbeefc] via-[#dbeefc]/50 to-transparent pointer-events-none" />

          {/* Top Left Title Overlay Matching Reference */}
          <div className="z-10 space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Your<br />Financial Goals<br />Our Support
            </h3>
            <div className="w-12 h-1 bg-[#0265dc] rounded-full" />
            <div className="text-[11px] font-bold text-slate-600 tracking-wider pt-1 uppercase">
              LOANS &nbsp;|&nbsp; INSURANCE &nbsp;|&nbsp; INVESTMENTS
            </div>
          </div>

          {/* Top Right Cursive Script Callout Matching Reference */}
          <div className="absolute top-10 right-10 z-10 text-right max-w-[170px]">
            <p className="font-serif italic text-lg font-bold text-[#1e3a8a] leading-tight">
              Building A Brighter Tomorrow With You
            </p>
          </div>

          {/* Center Icons Row Matching Reference */}
          <div className="z-10 my-auto">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/90 border border-blue-200 flex items-center justify-center text-[#0265dc] shadow-md">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">Apply Easily</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/90 border border-blue-200 flex items-center justify-center text-[#0265dc] shadow-md">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">Track Your<br />Progress</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/90 border border-blue-200 flex items-center justify-center text-[#0265dc] shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-800">Get Expert<br />Support</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="z-10 text-xs text-slate-600 font-serif italic">
            &ldquo;Empowering Dreams, Securing Futures • GFS Customer Portal&rdquo;
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerLogin;
