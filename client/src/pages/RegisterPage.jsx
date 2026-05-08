import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--color-surface-950)' }}>
      <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-14 h-14 rounded-2xl gradient-brand glow-brand flex items-center justify-center mb-4"
          >
            <Sparkles size={26} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-slate-400 mt-1 text-sm">Start analyzing resumes with AI</p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'name',     type: 'text',     label: 'Full Name', icon: <User size={16} />,  placeholder: 'John Doe',           key: 'name' },
              { id: 'email',    type: 'email',    label: 'Email',     icon: <Mail size={16} />,  placeholder: 'you@example.com',    key: 'email' },
              { id: 'password', type: 'password', label: 'Password',  icon: <Lock size={16} />,  placeholder: '8+ characters',      key: 'password' },
            ].map(({ id, type, label, icon, placeholder, key }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
                  <input
                    id={id} type={type} value={form[key]} placeholder={placeholder}
                    onChange={e => set(key)(e.target.value)} required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
            ))}

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white gradient-brand glow-brand disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
