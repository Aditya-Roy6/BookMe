import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

import { Ticket, Clock, Mail, Lock, AlertCircle, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, RotateCw, ArrowLeft, KeyRound, ShieldCheck, Sparkles } from '../components/MappedIcons';

export default function ResetPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  
  // OTP State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputsRef = useRef([]);
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setTimeLeft(300); 
      setResendCooldown(30); 
      toast.success('A 6-digit reset code has been sent to your email.', 'Code Dispatched');
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 200);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send OTP. Please try again.';
      setError(msg);
      toast.error(msg, 'Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = cleanVal;
    setOtpValues(newOtp);

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      toast.warning('Please enter the complete 6-digit verification code.', 'Incomplete Code');
      return;
    }

    if (timeLeft <= 0) {
      toast.error('Your verification code has expired. Please click "Resend Code".', 'Code Expired');
      return;
    }

    if (!password || password.length < 6) {
      toast.warning('Password must be at least 6 characters long.', 'Password Too Short');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, otp: fullOtp, newPassword: password });
      toast.success('Password updated successfully! Redirecting to login...', 'Password Reset');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired code. Please try again.';
      setError(msg);
      toast.error(msg, 'Reset Error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setOtpValues(['', '', '', '', '', '']);
      setTimeLeft(300);
      setResendCooldown(45);
      toast.success('A fresh 6-digit code has been sent to your email.', 'Code Resent');
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg, 'Resend Failed');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#121212] font-sans text-white">
      <div className="w-full max-w-md bg-[#181818] border border-[#282828] p-7 sm:p-9 rounded-3xl shadow-2xl space-y-6">
        {step === 1 ? (
          <>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-[0_0_25px_rgba(30,215,96,0.3)] mb-1">
                <KeyRound className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs text-[#b3b3b3]">
                Enter your email address to receive a secure 6-digit reset code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-[#7c7c7c] group-focus-within:text-[#1ed760] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] focus:border-[#1ed760] text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1ed760] transition-all placeholder:text-[#555]"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black uppercase tracking-[1.5px] text-xs rounded-full transition-all shadow-lg hover:shadow-[#1ed760]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#282828] text-center">
              <p className="text-xs text-[#b3b3b3]">
                Remembered your password?{' '}
                <Link
                  to="/login"
                  className="text-white font-bold hover:text-[#1ed760] transition-colors hover:underline underline-offset-4"
                >
                  Log In here
                </Link>
              </p>
            </div>
          </>
        ) : (
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
              <span>Back to Email</span>
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

            <form onSubmit={handleResetPassword} className="space-y-6">
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

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#b3b3b3]">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-[#7c7c7c] group-focus-within:text-[#1ed760] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#181818] border border-[#383838] focus:border-[#1ed760] text-white text-xs pl-10 pr-10 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1ed760] transition-all placeholder:text-[#555]"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7c7c7c] hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Reset Submit Button */}
              <button
                type="submit"
                disabled={loading || otpValues.join('').length !== 6 || timeLeft <= 0 || !password}
                className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black uppercase tracking-[1.5px] text-xs rounded-full transition-all shadow-lg hover:shadow-[#1ed760]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
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
