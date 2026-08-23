import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('luminatix_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem('luminatix_token');
        localStorage.removeItem('luminatix_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = res.data;
    localStorage.setItem('luminatix_token', token);
    localStorage.setItem('luminatix_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (name, email, password, role = 'customer') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data; // { requiresOtp: true, email, message }
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const { token, user: verifiedUser } = res.data;
    localStorage.setItem('luminatix_token', token);
    localStorage.setItem('luminatix_user', JSON.stringify(verifiedUser));
    setUser(verifiedUser);
    return verifiedUser;
  };

  const resendOtp = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('luminatix_token');
    localStorage.removeItem('luminatix_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
