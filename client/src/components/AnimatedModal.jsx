import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function AnimatedModal({ open, title, children, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-surface-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
