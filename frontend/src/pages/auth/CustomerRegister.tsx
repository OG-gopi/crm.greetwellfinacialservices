import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { GFSBrandHeader } from '../../components/common/GFSBrandHeader';
import { useVersion } from '../../context/VersionContext';

export const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { versionDisplay } = useVersion();

  // Step state: 1 = Personal Details Form, 2 = Registration Successful
  const [step, setStep] = useState<1 | 2>(1);

  // Personal Details Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredData, setRegisteredData] = useState<{
    customerIdCode: string;
    email: string;
    firstName: string;
  } | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setError('Mobile phone number is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the GFS Terms of Service to proceed.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
      });

      if (res.data.success) {
        setRegisteredData({
          customerIdCode: res.data.data.customerIdCode,
          email: res.data.data.email,
          firstName: res.data.data.firstName,
        });
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 min-h-[460px] sm:min-h-[480px]">
        
        {/* LEFT PANEL: Dark Navy Branding Panel */}
        <div className="w-full md:w-60 lg:w-64 bg-[#091526] text-white p-6 sm:p-7 flex flex-col justify-between items-center text-center z-10 shrink-0">
          <div className="my-auto flex flex-col items-center">
            <div className="mb-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <UserPlus className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold tracking-tight text-white">
              Customer Registration
            </h2>

            <div className="w-8 h-1 bg-blue-500 my-3 rounded-full" />

            <p className="text-xs text-slate-300 leading-relaxed max-w-[180px] font-medium">
              Create your secure customer portal account to access financial services
            </p>
          </div>

          <div className="pt-3 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Customer Account Portal
          </div>
        </div>

        {/* RIGHT / MAIN CONTENT AREA */}
        <div className="flex-1 bg-white text-slate-900 p-6 sm:p-7 lg:p-8 flex flex-col justify-between max-w-xl mx-auto w-full z-10">
          <div>
            <GFSBrandHeader accentColor="blue" size="md" />

            {/* Step 1: Customer Personal Details Form */}
            {step === 1 && (
              <div className="space-y-3 mt-1">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Create Customer Account
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Enter your personal details to set up your account
                  </p>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Optional last name"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Mobile Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-slate-700 text-[11px] font-bold mb-1">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Show Password & Terms Checkboxes */}
                  <div className="flex flex-wrap items-center justify-between text-xs pt-0.5 gap-2">
                    <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 mr-2"
                      />
                      Show Passwords
                    </label>

                    <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 mr-2"
                      />
                      Accept GFS Terms & Conditions
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl shadow-lg font-bold text-white bg-[#0a182e] hover:bg-[#071120] transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-1"
                  >
                    <span>{loading ? 'Creating Customer Account...' : 'Register Customer Account'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Registration Successful */}
            {step === 2 && registeredData && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
                    Registration Completed Successfully
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Welcome to Greetwell Financial Services!
                  </h2>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    Your customer account has been created for{' '}
                    <strong className="text-slate-900">{registeredData.email}</strong>. You may now log in to access financial services.
                  </p>
                </div>

                {/* Customer ID Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-w-sm mx-auto">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Customer ID</p>
                  <p className="font-mono text-lg font-black text-blue-600 mt-0.5">
                    {registeredData.customerIdCode}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/login?email=${encodeURIComponent(registeredData.email)}`)}
                  className="w-full py-3 px-4 rounded-xl shadow-lg font-bold text-white bg-[#0a182e] hover:bg-[#071120] transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Proceed to Customer Login</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Footer Back Link */}
            {step !== 2 && (
              <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-extrabold">
                    Sign In
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Version Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>© {new Date().getFullYear()} Greetwell Financial Services.</span>
            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {versionDisplay}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerRegister;

