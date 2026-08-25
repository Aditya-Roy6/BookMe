import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import { Ticket, LogOut, LayoutDashboard, Search, Settings, ShieldCheck, Sun, Moon } from './MappedIcons';
import { TicketRoundedIcon, SearchRoundedIcon } from './CustomRoundedIcons';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navSearch, setNavSearch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('luminatix_avatar') || '');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains('light-mode'));
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleStorage = () => {
      setAvatarUrl(localStorage.getItem('luminatix_avatar') || '');
    };
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/?search=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="w-full bg-[#121212]/70 backdrop-blur-2xl px-4 sm:px-8 py-3 sticky top-0 z-50 flex items-center justify-between border-b border-white/10 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Brand Logo & Main Nav Tabs */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center text-black group-hover:scale-105 transition-transform">
            <TicketRoundedIcon className="w-4 h-4 text-black fill-black" />
          </div>
          <span className="font-display text-lg font-black tracking-tight text-white flex items-center gap-1">
            BooK<span className="text-[#1ed760]">Me</span>
          </span>
        </Link>

        {/* Main Nav Items */}
        <div className="hidden lg:flex items-center gap-2 text-sm font-bold">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full transition-all ${
              isActive('/')
                ? 'bg-[#282828] text-white'
                : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            Discover
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className={`px-4 py-2 rounded-full transition-all ${
                isActive('/my-bookings')
                  ? 'bg-[#282828] text-white'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              My Tickets
            </Link>
          )}

          {user && (user.role === 'organiser' || user.role === 'admin') && (
            <Link
              to="/organiser/dashboard"
              className={`px-4 py-2 rounded-full transition-all ${
                isActive('/organiser/dashboard')
                  ? 'bg-[#282828] text-white'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              Organiser Hub
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link
              to="/admin/venues"
              className={`px-4 py-2 rounded-full transition-all ${
                isActive('/admin/venues')
                  ? 'bg-[#282828] text-white'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              Venues
            </Link>
          )}
        </div>
      </div>

        {/* Right Search Input, Theme Toggle & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const toggleTheme = () => {
              const isLight = document.documentElement.classList.toggle('light-mode');
              document.documentElement.classList.toggle('dark', !isLight);
              document.documentElement.classList.toggle('light', isLight);
              setIsDark(!isLight);
            };
            
            if (document.startViewTransition) {
              document.startViewTransition(toggleTheme);
            } else {
              toggleTheme();
            }
          }}
          className="w-8 h-8 rounded-full bg-[#181818] hover:bg-[#282828] border border-white/5 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors cursor-pointer preserve-color"
          title="Toggle Theme"
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Navbar Search Pill Form */}
        <form onSubmit={handleNavSearch} className="relative hidden sm:block w-48 md:w-64">
          <Search className="w-4 h-4 text-[#7c7c7c] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search movies, venues..."
            className="w-full bg-[#1f1f1f] hover:bg-[#282828] focus:bg-[#282828] text-white text-xs py-2 pl-9 pr-3 rounded-full border border-transparent focus:border-white focus:outline-none placeholder:text-[#7c7c7c] transition-all"
          />
        </form>

        {isAuthenticated ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer bg-[#181818] hover:bg-[#282828] p-1 pr-3 rounded-full transition-colors border border-white/5 focus:outline-none"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/10 preserve-color"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#1ed760] text-black font-black flex items-center justify-center text-xs preserve-color">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden sm:block text-white text-xs font-bold leading-none max-w-[120px] truncate">
                {user?.name}
              </span>
            </button>

            {/* Smooth Animated Spotify Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#242424] border border-[#383838] rounded-2xl shadow-2xl p-1.5 z-50 text-white space-y-1 origin-top-right backdrop-blur-xl"
                >
                  <div className="px-3 py-2 border-b border-white/10 text-left">
                    <p className="text-[10px] text-[#b3b3b3] font-medium">Signed in as</p>
                    <p className="font-bold text-white text-xs truncate mt-0.5">{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/my-bookings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#1ed760]" />
                    <span>My Bookings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#b3b3b3]" />
                    <span>Settings</span>
                  </button>

                  {(user?.role === 'organiser' || user?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/organiser/dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#ffa42b]" />
                      <span>Organiser Hub</span>
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/admin/venues');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1ed760]" />
                      <span>Venues Management</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-[#f3727f] hover:bg-[#281818] rounded-xl transition-colors flex items-center gap-2.5 border-t border-white/10 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-sm font-bold">
            <Link
              to="/login"
              className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-all px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="btn-high-contrast hover:scale-105 active:scale-95 px-5 py-2 rounded-full uppercase tracking-[1.4px] text-xs font-bold transition-all shadow-md"
            >
              Sign up
            </Link>
          </div>
        )}

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden w-8 h-8 rounded-full bg-[#181818] hover:bg-[#282828] border border-white/5 flex items-center justify-center text-white transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4 text-[#1ed760]" /> : <Menu className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#141414]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-5 shadow-2xl z-40 overflow-hidden space-y-4"
          >
            {/* Mobile Search Input */}
            <form onSubmit={(e) => { handleNavSearch(e); setMobileMenuOpen(false); }} className="relative w-full">
              <Search className="w-4 h-4 text-[#7c7c7c] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search movies, concerts, theatres..."
                className="w-full bg-[#1f1f1f] text-white text-xs py-2.5 pl-9 pr-3 rounded-full border border-white/10 focus:border-[#1ed760] focus:outline-none placeholder:text-[#7c7c7c]"
              />
            </form>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-1 text-sm font-bold">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                  isActive('/') ? 'bg-[#282828] text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <TicketRoundedIcon className="w-4 h-4" />
                <span>Discover</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isActive('/my-bookings') ? 'bg-[#282828] text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-[#1ed760]" />
                  <span>My Tickets</span>
                </Link>
              )}

              {user && (user.role === 'organiser' || user.role === 'admin') && (
                <Link
                  to="/organiser/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isActive('/organiser/dashboard') ? 'bg-[#282828] text-[#ffa42b]' : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#ffa42b]" />
                  <span>Organiser Hub</span>
                </Link>
              )}

              {user && user.role === 'admin' && (
                <Link
                  to="/admin/venues"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isActive('/admin/venues') ? 'bg-[#282828] text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-[#1ed760]" />
                  <span>Venues Management</span>
                </Link>
              )}
            </div>

            {/* Mobile Auth Buttons if logged out */}
            {!isAuthenticated && (
              <div className="pt-2 flex flex-col gap-2 border-t border-white/10">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full border border-white/20 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#1ed760] text-black font-bold text-xs uppercase tracking-wider shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
