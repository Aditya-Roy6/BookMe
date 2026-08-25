import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { Ticket, Clock, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Loader2, UserCheck, Building2, Eye, EyeOff, ShieldCheck, RotateCw, ArrowLeft, CheckCircle2 } from '../components/MappedIcons';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');

  // OTP State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputsRef = useRef([]);
  const { register, verifyOtp, resendOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown timer for 5-minute validity
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    let cooldownTimer;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle Step 1: Submit Form to dispatch OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      setStep(2);
      setTimeLeft(300); // 5 minutes
      setResendCooldown(30); // 30s cooldown before resend
      toast.success('A 6-digit verification code has been dispatched to your email.');
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 200);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    // Only allow alphanumeric / numeric
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = cleanVal;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtpValues(newOtp);
      const nextIdx = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    if (timeLeft <= 0) {
      setError('Your verification code has expired. Please click "Resend Code" to get a new code.');
      toast.error('Your verification code has expired. Please click "Resend Code".');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const verifiedUser = await verifyOtp(email, fullOtp);
      setSuccessMessage('Email verified successfully! Redirecting...');
      toast.success('Email verified successfully! Welcome to BooKMe!');
      setTimeout(() => {
        navigate(verifiedUser.role === 'organiser' ? '/organiser/dashboard' : '/');
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired OTP. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setError('');

    try {
      const res = await resendOtp(email);
      if (res && res.otp) {
        setDemoOtp(res.otp);
      }
      setOtpValues(['', '', '', '', '', '']);
      setTimeLeft(300); // Reset to 5 mins
      setResendCooldown(45);
      setSuccessMessage('A fresh 6-digit code has been sent to your email.');
      toast.success('A fresh 6-digit code has been sent to your email.');
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-[#121212] font-sans text-white">
      <div className="w-full max-w-md bg-[#181818] border border-[#282828] p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
        {step === 1 ? (
          /* ─── STEP 1: REGISTRATION FORM ─── */
          <>
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-lg shadow-[#1ed760]/20 mb-1">
                <Ticket className="w-6 h-6 fill-black" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sign up to start booking
              </h1>
              <p className="text-xs text-[#b3b3b3]">
                Join BooKMe to reserve seats or host live events
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[#281818] border border-[#f3727f]/50 flex items-center gap-2 text-[#f3727f] text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Account Role Segmented Pill Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Account Type
                </label>
                <div className="bg-[#121212] p-1 rounded-full flex items-center border border-[#383838]">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      role === 'customer'
                        ? 'bg-[#1ed760] text-black font-black'
                        : 'text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="-mt-[1px]">Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('organiser')}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      role === 'organiser'
                        ? 'bg-[#1ed760] text-black font-black'
                        : 'text-[#b3b3b3] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="-mt-[1px]">Organiser</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Roy"
                    className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-sm px-4 py-3 rounded-lg focus:outline-none placeholder:text-[#555555] transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-[#7c7c7c] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditya.roy9395525@gmail.com"
                    className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-sm px-4 py-3 rounded-lg focus:outline-none placeholder:text-[#555555] transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#7c7c7c] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-sm px-4 py-3 rounded-lg focus:outline-none placeholder:text-[#555555] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7c7c] hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Pill Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold uppercase tracking-[1.4px] text-xs rounded-full shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="pt-3 border-t border-[#282828] text-center text-xs text-[#b3b3b3]">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-[#1ed760] font-bold underline ml-1">
                Log in here
              </Link>
            </div>
          </>
        ) : (
          /* ─── STEP 2: OTP VERIFICATION CODE SCREEN ─── */
          <>
            <button
              onClick={() => {
                setStep(1);
                setError('');
                setSuccessMessage('');
              }}
              className="text-xs text-[#b3b3b3] hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Details</span>
            </button>

            <div className="flex flex-col items-center text-center space-y-3 pt-1">
              <div className="w-14 h-14 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-[0_0_25px_rgba(30,215,96,0.3)] mb-1">
                <Lock className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Enter Verification Code
              </h1>
              <p className="text-xs text-[#b3b3b3] max-w-[300px] leading-relaxed">
                We sent a 6-digit code to <strong className="text-white font-bold">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#281818] border border-[#f3727f]/50 flex items-center gap-2 text-[#f3727f] text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#b3b3b3] text-center">
                  6-Digit Verification Code
                </label>

                {/* Spotify-style Rounded OTP Boxes */}
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => {
                    const isFocused = focusedIndex === idx;
                    const hasValue = Boolean(digit);

                    return (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onFocus={() => setFocusedIndex(idx)}
                        onBlur={() => setFocusedIndex(null)}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl transition-all duration-200 outline-none ${
                          isFocused
                            ? 'bg-[#181818] border-2 border-[#1ed760] shadow-[0_0_15px_rgba(30,215,96,0.35)] text-white scale-105'
                            : hasValue
                            ? 'bg-[#222222] border border-[#555] text-white'
                            : 'bg-[#181818] border border-[#333] text-[#666]'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Expiry & Resend Bar */}
                <div className="flex items-center justify-between px-1 pt-2 text-xs font-semibold">
                  {timeLeft > 0 ? (
                    <span className="text-[#1ed760] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expires in <strong className="font-mono font-bold">{formatTimer(timeLeft)}</strong></span>
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Code Expired</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || resendCooldown > 0}
                    className="flex items-center gap-1.5 text-[#b3b3b3] hover:text-[#1ed760] transition-colors disabled:opacity-40 disabled:hover:text-[#b3b3b3] cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin text-[#1ed760]' : ''}`} />
                    <span>
                      {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otpValues.join('').length !== 6 || timeLeft <= 0}
                className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black uppercase tracking-[1.5px] text-xs rounded-full transition-all shadow-lg hover:shadow-[#1ed760]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Activate Account</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
