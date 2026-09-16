import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Users, User, Home, Shield, LineChart, Sparkles, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { GFSBrandHeader } from '../../components/common/GFSBrandHeader';

interface AgentLoginProps {
  initialCategory?: 'LOAN' | 'INSURANCE' | 'INVESTMENT';
}

export const AgentLogin: React.FC<AgentLoginProps> = ({ initialCategory = 'LOAN' }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<'LOAN' | 'INSURANCE' | 'INVESTMENT'>(initialCategory);
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

  const getRequiredRole = () => {
    switch (activeCategory) {
      case 'LOAN':
        return 'LOAN_AGENT';
      case 'INSURANCE':
        return 'INSURANCE_AGENT';
      case 'INVESTMENT':
        return 'INVESTMENT_AGENT';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { 
        email, 
        password,
        requiredCategory: 'AGENT',
        requiredRole: getRequiredRole()
      });
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        
        switch (user.role) {
          case 'LOAN_AGENT':
            navigate('/loan-agent/dashboard');
            break;
          case 'INSURANCE_AGENT':
            navigate('/insurance-agent/dashboard');
            break;
          case 'INVESTMENT_AGENT':
            navigate('/investment-agent/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Agent login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      {/* Card Container Matching Reference Card 2 */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 min-h-[580px]">
        
        {/* LEFT PANEL: Emerald Green with Group Icon & Badge Pill */}
        <div className="w-full md:w-64 lg:w-72 bg-[#0c5837] text-white p-8 sm:p-10 flex flex-col justify-between items-center text-center z-10 shrink-0">
          <div className="my-auto flex flex-col items-center">
            {/* Users Icon */}
            <div className="mb-3 p-3 rounded-2xl bg-white/10 text-white border border-white/20">
              <Users className="w-10 h-10" />
            </div>

            {/* Panel Title */}
            <h2 className="text-xl font-bold tracking-tight text-white">
              Agent Login
            </h2>

            {/* Mint Accent Bar */}
            <div className="w-10 h-1 bg-emerald-400 my-4 rounded-full" />

            {/* Description Subtext */}
            <p className="text-xs text-emerald-100 leading-relaxed max-w-[200px] font-medium">
              For Loan Agents, Insurance Agents, Investment Agents
            </p>
          </div>

          {/* Bottom Badge Pill Matching Reference */}
          <div className="w-full pt-4">
            <div className="bg-[#d1fae5] text-[#065f46] font-bold text-[11px] rounded-full py-2.5 px-3 text-center shadow-sm">
              No Registration (Only Login)
            </div>
          </div>
        </div>

        {/* CENTER PANEL: White Login Card */}
        <div className="flex-1 bg-white text-slate-900 p-8 sm:p-10 lg:p-12 flex flex-col justify-between max-w-md mx-auto w-full z-10">
          <div>
            {/* GFS Brand Header */}
            <GFSBrandHeader accentColor="emerald" />

            {/* Title & Subtitle */}
            <div className="text-center mt-3 mb-4">
              <h1 className="text-2xl font-extrabold text-[#0c5837] tracking-tight">
                Agent Login
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sign in to access your agent portal
              </p>
            </div>

            {/* Domain Switching Quick Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveCategory('LOAN')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  activeCategory === 'LOAN' ? 'bg-[#0c5837] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3 h-3" /> Loan
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('INSURANCE')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  activeCategory === 'INSURANCE' ? 'bg-[#0c5837] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3 h-3" /> Insurance
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('INVESTMENT')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                  activeCategory === 'INVESTMENT' ? 'bg-[#0c5837] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Investment
              </button>
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
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c5837] focus:bg-white transition-all"
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
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c5837] focus:bg-white transition-all"
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
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0c5837] focus:ring-[#0c5837] mr-2"
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-[#0c5837] hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>

              {/* Action Button Matching Reference */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl shadow-lg font-bold text-white bg-[#0c5837] hover:bg-[#084229] active:bg-[#052b1b] focus:outline-none transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>{loading ? 'Authenticating...' : 'Login to Agent Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            </div>

          {/* Footer Line Matching Reference */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>© 2024 Greetwell Financial Services. All rights reserved.</span>
            <span className="font-mono">Version {version}</span>
          </div>
        </div>

        {/* RIGHT PANEL: Advisor Hero Visual Matching Reference */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0b482e] via-[#06331f] to-[#031d12] p-10 flex-col justify-between text-white border-l border-emerald-900">
          {/* Advisor Background Photo Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06331f] via-[#06331f]/60 to-transparent pointer-events-none" />

          {/* Top Left Title Overlay Matching Reference */}
          <div className="z-10 space-y-1">
            <h3 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
              Grow Together<br />Serve Better
            </h3>
            <div className="w-12 h-1 bg-emerald-400 rounded-full" />
          </div>

          {/* Top Right Guidance Callout */}
          <div className="absolute top-10 right-10 z-10 text-right max-w-[140px]">
            <p className="text-xs font-semibold text-emerald-100 leading-tight">
              Trusted Guidance For A Brighter Tomorrow
            </p>
          </div>

          {/* Center Icons Row & Script Overlay Matching Reference */}
          <div className="z-10 my-auto space-y-6">
            {/* 3 Service Pillar Badges */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">Loans</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">Insurance</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
                  <LineChart className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">Investments</span>
              </div>
            </div>

            {/* Cursive Handwriting Script Text Overlay Matching Reference */}
            <div className="pt-2">
              <p className="font-serif italic text-2xl text-emerald-200 tracking-wide drop-shadow-md">
                Your Partnership Our Progress
              </p>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="z-10 text-xs text-emerald-200/80 font-serif italic">
            &ldquo;Advisor Portal • Client Portfolio Command&rdquo;
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentLogin;
