import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--color-surface-950)' }}>
      {/* Background orbs */}
      <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md mx-4"
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-14 h-14 rounded-2xl gradient-brand glow-brand flex items-center justify-center mb-4"
          >
            <Sparkles size={26} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your ResumeAI account</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="email" type="email" label="Email" icon={<Mail size={16} />}
              value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))}
              placeholder="you@example.com"
            />
            <div className="relative">
              <InputField
                id="password" type={showPw ? 'text' : 'password'} label="Password" icon={<Lock size={16} />}
                value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-white transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white gradient-brand glow-brand transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ id, type, label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>
    </div>
  );
}
