import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Award, Zap } from 'lucide-react';
import api from '../lib/api';

const CHART_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong px-3 py-2 rounded-xl text-xs">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' ? `${Math.round(p.value)}%` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const scoreHistory = (data?.scoreHistory || []).map((h, i) => ({
    name: `Run ${i + 1}`,
    ATS: Math.round(h.atsScore),
    Keywords: Math.round(h.keywordScore),
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const topSkills = data?.topSkills || [];

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Track your resume performance over time.</p>
      </motion.div>

      {/* Stat row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      >
        {[
          { label: 'Total Resumes',   value: data?.stats?.totalResumes ?? 0,               icon: <Award size={18} />,    color: '#6366f1' },
          { label: 'Latest ATS Score', value: `${data?.stats?.latestScore ?? 0}%`,          icon: <TrendingUp size={18} />, color: '#10b981' },
          { label: 'Score Growth',     value: `${data?.stats?.scoreImprovement >= 0 ? '+' : ''}${data?.stats?.scoreImprovement ?? 0}%`, icon: <Zap size={18} />, color: '#f59e0b' },
        ].map(({ label, value, icon, color }) => (
          <motion.div key={label} whileHover={{ y: -2 }}
            className="card p-5 flex items-center gap-4 transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}1a`, color }}>
              {icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score over time */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-5">ATS Score Trend</h2>
          {scoreHistory.length < 2 ? (
            <EmptyChart message="Upload and analyze more resumes to see trends" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={scoreHistory} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="kwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ATS" stroke="#6366f1" strokeWidth={2} fill="url(#atsGrad)" dot={{ fill: '#6366f1', r: 3 }} />
                <Area type="monotone" dataKey="Keywords" stroke="#a855f7" strokeWidth={2} fill="url(#kwGrad)" dot={{ fill: '#a855f7', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top Skills */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Top Skills Detected</h2>
          {topSkills.length === 0 ? (
            <EmptyChart message="Analyze resumes to see skill frequency" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSkills} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="skill" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {topSkills.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Resume performance table */}
      {data?.resumes?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Resume Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  {['Resume', 'ATS Score', 'Keywords', 'Formatting', 'Experience', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left pb-3 pr-6 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                {data.resumes.map((r) => {
                  const a = r.latestAnalysis;
                  return (
                    <tr key={r.id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-3 pr-6 text-white font-medium max-w-[140px] truncate">{r.title || r.originalName}</td>
                      <ScoreCell value={a?.atsScore} />
                      <ScoreCell value={a?.keywordScore} />
                      <ScoreCell value={a?.formattingScore} />
                      <ScoreCell value={a?.experienceScore} />
                      <td className="py-3 pr-6">
                        <StatusDot status={r.status} />
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ScoreCell({ value }) {
  if (value == null) return <td className="py-3 pr-6 text-slate-600">—</td>;
  const v = Math.round(value);
  const color = v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f43f5e';
  return <td className="py-3 pr-6 font-semibold" style={{ color }}>{v}%</td>;
}

function StatusDot({ status }) {
  const map = { COMPLETED: '#10b981', PROCESSING: '#6366f1', PENDING: '#475569', FAILED: '#f43f5e' };
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: map[status] || '#475569' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: map[status] || '#475569' }} />
      {status}
    </span>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-slate-600 text-sm text-center">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--color-surface-800)' }} />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--color-surface-800)' }} />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[1,2].map(i => <div key={i} className="h-72 rounded-2xl" style={{ background: 'var(--color-surface-800)' }} />)}
      </div>
    </div>
  );
}
