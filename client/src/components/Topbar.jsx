import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{
        background: 'rgba(10,10,15,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onMenuClick}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu size={20} />
      </motion.button>

      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 relative"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
        </motion.button>

        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
