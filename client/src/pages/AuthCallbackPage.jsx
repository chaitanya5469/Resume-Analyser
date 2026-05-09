import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const { completeTokenLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const finishLogin = async () => {
      const providerError = params.get('error');
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (providerError) {
        setError(providerError);
        return;
      }
      if (!accessToken || !refreshToken) {
        setError('The sign-in response was missing required tokens.');
        return;
      }

      try {
        await completeTokenLogin({ accessToken, refreshToken });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Social sign-in failed. Please try again.');
      }
    };

    finishLogin();
  }, [completeTokenLogin, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface-950)' }}>
      <div className="glass-strong rounded-2xl p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl gradient-brand glow-brand flex items-center justify-center mx-auto mb-5">
          <Sparkles size={26} className="text-white" />
        </div>
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Sign-in failed</h1>
            <p className="text-sm text-slate-400 mb-6">{error}</p>
            <Link to="/login" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <motion.div
              className="flex justify-center text-brand-400 mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            >
              <LoaderCircle size={28} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Signing you in</h1>
            <p className="text-sm text-slate-400">Finishing secure authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}
