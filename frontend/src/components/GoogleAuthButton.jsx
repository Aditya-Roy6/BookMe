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
  const [loading, setLoading] = useState(false);
  const { googleLogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '989140602013-nu51sssd0qln6d96ahmccaps6tlgc5e6.apps.googleusercontent.com';

  const handleGoogleClick = () => {
    if (loading) return;

    if (!window.google?.accounts?.oauth2) {
      toast.info('Google services are initializing. Please try again in 2 seconds.');
      return;
    }

    setLoading(true);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google OAuth token error:', tokenResponse);
            setLoading(false);
            if (tokenResponse.error !== 'user_cancelled' && tokenResponse.error !== 'access_denied') {
              toast.error(tokenResponse.error_description || 'Google sign-in was cancelled or failed.');
            }
            return;
          }

          try {
            // Fetch Google user profile details using the access token
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await res.json();

            if (!userInfo.email) {
              throw new Error('No email found in Google account profile');
            }

            // Post to backend to issue JWT session
            const loggedUser = await googleLogin(
              { accessToken: tokenResponse.access_token, userInfo },
              role
            );

            toast.success(`Welcome to BooKMe, ${loggedUser.name || 'User'}!`);

            const target =
              typeof redirectPath === 'object' && redirectPath.pathname
                ? `${redirectPath.pathname}${redirectPath.search || ''}`
                : loggedUser.role === 'organiser'
                ? '/organiser/dashboard'
                : redirectPath;

            navigate(target, { replace: true });
          } catch (apiErr) {
            console.error('Backend Google auth error:', apiErr);
            const msg =
              apiErr.response?.data?.error ||
              apiErr.message ||
              'Google authentication failed on server.';
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        },
      });

      // Request token with popup account picker
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('Error invoking Google token client:', err);
      setLoading(false);
      toast.error('Could not open Google sign-in window. Please check popup permissions.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4 py-1">
      {/* Spotify-styled Dark Pill Google Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full max-w-[340px] py-3.5 px-6 bg-[#121212] hover:bg-[#202020] active:bg-[#282828] text-white border border-[#383838] hover:border-white/50 font-bold text-xs uppercase tracking-[1.4px] rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#1ed760]" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 flex-shrink-0 shadow-sm">
              <GoogleIcon className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
            </span>
          </>
        )}
      </button>

      {/* Security subtitle */}
      <div className="text-center text-[11px] text-[#7c7c7c] max-w-[280px] leading-relaxed">
        Google securely verifies your identity. Instant access without typing a password.
      </div>
    </div>
  );
}
