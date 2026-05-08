import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, BarChart3, Upload,
  LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resumes', icon: FileText, label: 'My Resumes' },
  { to: '/upload', icon: Upload, label: 'Upload Resume' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ open }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: open ? 240 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col flex-shrink-0 h-full overflow-hidden"
      style={{
        background: 'var(--color-surface-900)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 gradient-brand glow-brand">
          <Sparkles size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-white text-lg tracking-tight whitespace-nowrap"
            >
              Resume<span className="gradient-text">AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={clsx(
                  'flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                  open ? 'px-3 justify-start' : 'mx-auto w-11 justify-center px-0',
                  isActive
                    ? 'gradient-brand text-white glow-brand'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Avatar row */}
        <div className={clsx('flex items-center gap-3 px-3 py-2', !open && 'justify-center')}>
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200',
            open ? 'w-full px-3 justify-start' : 'mx-auto w-11 px-0 justify-center'
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>


    </motion.aside>
  );
}
