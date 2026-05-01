import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import OAuthCallback from './pages/Auth/OAuthCallback';
import DashboardPage from './pages/Dashboard/DashboardPage';
import WorkspacePage from './pages/Workspace/WorkspacePage';
import BoardPage from './pages/Board/BoardPage';
import SettingsPage from './pages/Settings/SettingsPage';
import PricingPage from './pages/Pricing/PricingPage';
import './index.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c26',
            color: '#f1f5f9',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Auth (only for logged-out) */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* Private */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/workspace/:id" element={<PrivateRoute><WorkspacePage /></PrivateRoute>} />
        <Route path="/board/:id" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
        <Route path="/settings/*" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
