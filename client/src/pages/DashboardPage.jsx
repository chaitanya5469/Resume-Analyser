import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, CheckCircle, Upload, ArrowUpRight, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ScoreRing from '../components/ScoreRing';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(({ data }) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = analytics?.stats;

  const STAT_CARDS = [
    { label: 'Total Resumes',      value: stats?.totalResumes ?? 0,                icon: FileText,    color: '#6366f1' },
    { label: 'Analyses Run',       value: stats?.completedAnalyses ?? 0,           icon: CheckCircle, color: '#10b981' },
    { label: 'Avg ATS Score',      value: `${stats?.avgAtsScore ?? 0}%`,           icon: TrendingUp,  color: '#f59e0b' },
    { label: 'Score Improvement',  value: `+${stats?.scoreImprovement ?? 0}%`,     icon: Sparkles,    color: '#a855f7' },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Good {getTimeOfDay()},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]} 👋</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here's an overview of your resume performance.</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={stagger.container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} variants={stagger.item}>
            <StatCard label={label} value={loading ? '—' : value} icon={<Icon size={20} />} color={color} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent resumes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Resumes</h2>
            <Link to="/resumes" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : analytics?.resumes?.length ? (
            <div className="space-y-3">
              {analytics.resumes.slice(0, 5).map((r) => (
                <ResumeRow key={r.id} resume={r} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </motion.div>

        {/* ATS score ring */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="card p-6 flex flex-col items-center justify-center gap-4"
        >
          <h2 className="text-lg font-semibold text-white self-start">Latest ATS Score</h2>
          {loading ? (
            <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: 'var(--color-surface-700)' }} />
          ) : (
            <ScoreRing score={stats?.latestScore ?? 0} size={160} strokeWidth={12} />
          )}
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              {getScoreLabel(stats?.latestScore ?? 0)}
            </p>
            <Link to="/upload"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-brand text-white glow-brand transition-all">
              <Upload size={14} /> Analyze New Resume
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${color}22` }}
      className="card p-5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, color }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ResumeRow({ resume }) {
  const score = resume.latestAnalysis?.atsScore;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <Link to={`/resumes/${resume.id}`}>
      <motion.div
        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
        className="flex items-center gap-4 p-3 rounded-xl transition-all duration-150 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)' }}>
          <FileText size={16} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{resume.title || resume.originalName}</p>
          <p className="text-xs text-slate-500">{new Date(resume.createdAt).toLocaleDateString()}</p>
        </div>
        {score != null ? (
          <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
            style={{ background: `${scoreColor}22`, color: scoreColor }}>
            {Math.round(score)}%
          </span>
        ) : (
          <span className="text-xs text-slate-600 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            Pending
          </span>
        )}
      </motion.div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
      <div className="w-9 h-9 rounded-lg" style={{ background: 'var(--color-surface-700)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded" style={{ background: 'var(--color-surface-700)' }} />
        <div className="h-2 w-1/3 rounded" style={{ background: 'var(--color-surface-700)' }} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <FileText size={40} className="mx-auto text-slate-700 mb-3" />
      <p className="text-slate-500 text-sm">No resumes yet</p>
      <Link to="/upload" className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-brand text-white">
        <Upload size={14} /> Upload your first resume
      </Link>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getScoreLabel(score) {
  if (score >= 85) return '🎉 Excellent! Your resume is ATS-ready.';
  if (score >= 70) return '👍 Good. A few tweaks will make it great.';
  if (score >= 50) return '⚡ Fair. Several improvements recommended.';
  if (score === 0) return 'Upload a resume to get your ATS score.';
  return '⚠️ Needs significant improvements.';
}
