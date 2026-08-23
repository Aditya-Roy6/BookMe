import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Ticket, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back to BooKMe!');
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const errMsg = data?.error || 'Invalid email or password. Please try again.';
      toast.error(errMsg);

      if (data?.requiresOtp) {
        navigate('/register', { state: { email, step: 'otp' } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.info(`Pre-filled credentials for ${demoEmail.split('@')[0]}. Click "Log In" to proceed.`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-[#121212]">
      <div className="w-full max-w-md bg-[#181818] border border-[#282828] p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
        {/* BooKMe Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#1ed760] flex items-center justify-center text-black shadow-lg shadow-[#1ed760]/20 mb-1">
            <Ticket className="w-6 h-6 fill-black" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
            Log in to BooKMe
          </h1>
          <p className="text-xs text-[#b3b3b3]">
            Access your tickets, live holds, and reservations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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
                placeholder="alex@example.com"
                className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-sm px-4 py-3 rounded-lg focus:outline-none placeholder:text-[#555555] transition-all"
              />
              <Mail className="w-4 h-4 text-[#7c7c7c] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121212] border border-[#383838] hover:border-white focus:border-white text-white text-sm px-4 py-3 rounded-lg focus:outline-none placeholder:text-[#555555] transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c7c7c] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Pill Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold uppercase tracking-[1.4px] text-xs rounded-full shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Pre-Fill Demo Accounts Pill Bar */}
        <div className="pt-3 border-t border-[#282828] space-y-2">
          <span className="text-[10px] text-[#7c7c7c] uppercase tracking-wider font-bold block text-center">
            Quick Demo Accounts (Pre-Fill)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('customer@luminatix.com', 'password123')}
              className="py-2 px-2 bg-[#1f1f1f] hover:bg-[#282828] text-white hover:text-[#1ed760] rounded-lg text-[11px] font-bold transition-all border border-white/5 text-center truncate cursor-pointer"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('organiser@luminatix.com', 'password123')}
              className="py-2 px-2 bg-[#1f1f1f] hover:bg-[#282828] text-white hover:text-[#1ed760] rounded-lg text-[11px] font-bold transition-all border border-white/5 text-center truncate cursor-pointer"
            >
              Organiser
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@luminatix.com', 'password123')}
              className="py-2 px-2 bg-[#1f1f1f] hover:bg-[#282828] text-white hover:text-[#1ed760] rounded-lg text-[11px] font-bold transition-all border border-white/5 text-center truncate cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-2 text-center text-xs text-[#b3b3b3] flex flex-col gap-2">
          <Link to="/reset-password" className="text-white hover:text-[#1ed760] font-bold underline transition-colors">
            Forgot your password?
          </Link>
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:text-[#1ed760] font-bold underline ml-1 transition-colors">
              Sign up for BooKMe
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

