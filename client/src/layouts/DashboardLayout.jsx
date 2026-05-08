import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-950)' }}>
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-6"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
