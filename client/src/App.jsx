import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import DashboardLayout from './layouts/DashboardLayout';
import PageLoader from './components/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ResumesPage = lazy(() => import('./pages/ResumesPage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<div className="min-h-screen p-6" style={{ background: 'var(--color-surface-950)' }}><PageLoader /></div>}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/resumes" element={<ResumesPage />} />
                  <Route path="/resumes/:id" element={<AnalysisPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                </Route>
              </Route>

              <Route path="*" element={<LoginPage />} />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
