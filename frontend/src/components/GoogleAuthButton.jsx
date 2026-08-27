import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loader2 } from './MappedIcons';

export function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleAuthButton({ role = 'customer', mode = 'login' }) {
  const googleBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const { googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '989140602013-nu51sssd0qln6d96ahmccaps6tlgc5e6.apps.googleusercontent.com';

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google sign-in was cancelled or failed.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await googleLogin(response.credential, role);
      toast.success(`Welcome to BooKMe, ${loggedUser.name || 'User'}!`);
      const target =
        typeof redirectPath === 'object' && redirectPath.pathname
          ? `${redirectPath.pathname}${redirectPath.search || ''}`
          : loggedUser.role === 'organiser'
          ? '/organiser/dashboard'
          : redirectPath;
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Google auth error:', err);
      const errMsg = err.response?.data?.error || 'Google authentication failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 320,
            });
          }
          setSdkReady(true);
          return true;
        } catch (e) {
          console.warn('Google Identity Services init warning:', e);
        }
      }
      return false;
    };

    if (!initGsi()) {
      intervalId = setInterval(() => {
        if (initGsi()) {
          clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, mode, role]);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4 py-2">
      {/* Google official rendered button container */}
      <div className="w-full flex justify-center py-2">
        <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs text-[#1ed760] font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-[#1ed760]" />
          <span>Verifying Google account & signing in...</span>
        </div>
      )}

      {/* Security note */}
      <div className="text-center text-[11px] text-[#7c7c7c] max-w-[280px] leading-relaxed">
        Google securely verifies your identity. Instant access without typing a password.
      </div>
    </div>
  );
}
