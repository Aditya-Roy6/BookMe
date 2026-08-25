import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventDiscovery from './pages/EventDiscovery';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import BookingHistory from './pages/BookingHistory';
import CustomerSettings from './pages/CustomerSettings';
import BookedSeatsView from './pages/BookedSeatsView';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AdminVenues from './pages/AdminVenues';
import WaitlistOfferClaim from './pages/WaitlistOfferClaim';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import IconManager from './pages/IconManager';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#121212] text-[#f5f5f7]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<EventDiscovery />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/showtime/:id/seats" element={<SeatSelection />} />
              <Route path="/waitlist/claim/:token" element={<WaitlistOfferClaim />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-icon" element={<IconManager />} />

              {/* Customer Routes */}
              <Route
                path="/checkout/:id"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <BookingHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings/:id/seats"
                element={
                  <ProtectedRoute>
                    <BookedSeatsView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <CustomerSettings />
                  </ProtectedRoute>
                }
              />

              {/* Organiser Routes */}
              <Route
                path="/organiser/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['organiser', 'admin']}>
                    <OrganiserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/venues"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVenues />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
