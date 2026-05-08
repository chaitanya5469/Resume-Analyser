import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-950)' }}>
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#6366f1' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
