import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import DashboardLayout from './layouts/DashboardLayout';
import PageLoader from './components/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
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
