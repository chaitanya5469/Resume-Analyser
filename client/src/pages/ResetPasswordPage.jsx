import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Sparkles } from 'lucide-react';
import api from '../lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = params.get('token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Password reset token is missing.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      setSuccess(data.message || 'Password reset successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-surface-950)' }}>
      <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-4">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-brand glow-brand flex items-center justify-center mb-4">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Set new password</h1>
          <p className="text-slate-400 mt-1 text-sm text-center">Choose a new password for your account.</p>
        </div>

        <div className="glass-strong rounded-2xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20">
              {error}
            </div>
          )}
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock size={30} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Password updated</h3>
              <p className="text-slate-400 text-sm mb-6">{success}</p>
              <Link to="/login" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordInput
                id="password"
                label="New Password"
                value={form.password}
                onChange={value => setForm(current => ({ ...current, password: value }))}
                placeholder="8+ characters"
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={value => setForm(current => ({ ...current, confirmPassword: value }))}
                placeholder="Confirm password"
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white gradient-brand glow-brand transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={16} /></span>
        <input
          id={id}
          type="password"
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          required
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>
    </div>
  );
}
