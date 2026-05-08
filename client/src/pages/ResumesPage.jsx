import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Trash2, ArrowUpRight, Plus, Search } from 'lucide-react';
import api from '../lib/api';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/resumes')
      .then(({ data }) => setResumes(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume and all its analyses?')) return;
    setDeleting(id);
    try {
      await api.delete(`/resumes/${id}`);
      setResumes(r => r.filter(x => x.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = resumes.filter(r =>
    (r.title || r.originalName).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Resumes</h1>
          <p className="text-slate-400 text-sm mt-1">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <Link to="/upload">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand glow-brand">
            <Plus size={16} /> New Resume
          </motion.button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text" placeholder="Search resumes…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
          style={{ background: 'var(--color-surface-800)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          {filtered.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={() => handleDelete(resume.id)}
              deleting={deleting === resume.id}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ResumeCard({ resume, onDelete, deleting }) {
  const score = resume.analyses?.[0]?.atsScore;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score != null ? '#f43f5e' : '#475569';

  const statusColors = {
    COMPLETED: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
    PROCESSING: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
    PENDING:    { bg: 'rgba(255,255,255,0.06)', text: '#64748b' },
    FAILED:     { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e' },
  };
  const sc = statusColors[resume.status] || statusColors.PENDING;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
      className="card p-5 flex flex-col gap-4 transition-all duration-200"
    >
      {/* Icon + score */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)' }}>
          <FileText size={20} className="text-brand-400" />
        </div>
        {score != null ? (
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: scoreColor }}>{Math.round(score)}</p>
            <p className="text-xs text-slate-500">ATS Score</p>
          </div>
        ) : (
          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: sc.bg, color: sc.text }}>
            {resume.status}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex-1">
        <p className="font-semibold text-white text-sm leading-tight line-clamp-2">
          {resume.title || resume.originalName}
        </p>
        {resume.targetRole && (
          <p className="text-xs text-slate-500 mt-1">→ {resume.targetRole}</p>
        )}
        <p className="text-xs text-slate-600 mt-2">{new Date(resume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Link to={`/resumes/${resume.id}`} className="flex-1">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-all"
            style={{ background: 'rgba(99,102,241,0.2)' }}>
            View Analysis <ArrowUpRight size={13} />
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          disabled={deleting}
          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
        >
          {deleting ? <span className="w-4 h-4 rounded-full border-2 border-rose-400/30 border-t-rose-400 animate-spin block" />
            : <Trash2 size={15} />}
        </motion.button>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="w-11 h-11 rounded-xl" style={{ background: 'var(--color-surface-700)' }} />
        <div className="w-12 h-8 rounded" style={{ background: 'var(--color-surface-700)' }} />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded" style={{ background: 'var(--color-surface-700)' }} />
        <div className="h-2 w-1/2 rounded" style={{ background: 'var(--color-surface-700)' }} />
      </div>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="text-center py-20">
      <FileText size={48} className="mx-auto text-slate-700 mb-4" />
      <p className="text-slate-400">{search ? `No resumes matching "${search}"` : 'No resumes uploaded yet'}</p>
      {!search && (
        <Link to="/upload" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium gradient-brand text-white">
          <Plus size={15} /> Upload your first resume
        </Link>
      )}
    </div>
  );
}
