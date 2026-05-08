/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const notify = useCallback(({ type = 'info', title, message }) => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const dismiss = (id) => setItems((current) => current.filter((item) => item.id !== id));

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2rem))] space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const Icon = icons[item.type] || Info;
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, x: 28, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 28, scale: 0.96 }}
                className="glass-strong rounded-xl p-4 shadow-2xl">
                <div className="flex gap-3">
                  <Icon size={18} className={item.type === 'error' ? 'text-rose-400' : item.type === 'success' ? 'text-emerald-400' : 'text-brand-400'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    {item.message && <p className="mt-1 text-xs text-slate-400">{item.message}</p>}
                  </div>
                  <button onClick={() => dismiss(item.id)} className="text-slate-500 hover:text-white">
                    <X size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotificationContext)?.notify || (() => {});
}
