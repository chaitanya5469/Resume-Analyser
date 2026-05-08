import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Target, AlertTriangle, CheckCircle,
  MessageSquare, FileEdit, ChevronDown, ChevronUp, Loader2,
  Download, Share2, Mail
} from 'lucide-react';
import api from '../lib/api';
import ScoreRing from '../components/ScoreRing';
import AnimatedModal from '../components/AnimatedModal';
import { useNotify } from '../contexts/NotificationContext';

const TABS = ['Overview', 'Suggestions', 'Skills', 'Tailor', 'Interview'];

export default function AnalysisPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [jd, setJd] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    api.get(`/resumes/${id}`)
      .then(({ data }) => {
        setResume(data);
        setAnalysis(data.analyses?.[0] ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleTailor = async () => {
    if (!jd.trim()) return;
    setTailoring(true);
    try {
      const { data } = await api.post(`/analyses/resume/${id}/tailor`, { jobDescription: jd });
      setAnalysis(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Tailoring failed');
    } finally {
      setTailoring(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const { data } = await api.get(`/analyses/${analysis.id}/report.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume-analysis-report.pdf';
      link.click();
      URL.revokeObjectURL(url);
      notify({ type: 'success', title: 'Report exported', message: 'Your PDF report is ready.' });
    } catch {
      notify({ type: 'error', title: 'Export failed', message: 'Could not generate the PDF report.' });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/api/analyses/public/${analysis.id}`;
    await navigator.clipboard.writeText(url);
    notify({ type: 'success', title: 'Share link copied', message: 'Public analysis JSON link copied to clipboard.' });
  };

  const handleCoverLetter = async () => {
    if (!jd.trim()) {
      setActiveTab('Tailor');
      notify({ type: 'info', title: 'Add a job description', message: 'Paste a JD in the Tailor tab first.' });
      return;
    }
    setCoverLetterLoading(true);
    try {
      const { data } = await api.post(`/analyses/resume/${id}/cover-letter`, {
        jobDescription: jd,
        company: resume.targetCompany,
      });
      setCoverLetter(data.coverLetter || data);
    } catch {
      notify({ type: 'error', title: 'Cover letter failed', message: 'Gemini could not generate it right now.' });
    } finally {
      setCoverLetterLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!resume) return <div className="text-slate-400 p-8">Resume not found</div>;

  const subScores = analysis ? [
    { label: 'Keywords',     value: analysis.keywordScore },
    { label: 'Formatting',   value: analysis.formattingScore },
    { label: 'Readability',  value: analysis.readabilityScore },
    { label: 'Experience',   value: analysis.experienceScore },
    { label: 'Skills',       value: analysis.skillsScore },
  ] : [];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/resumes">
          <motion.button whileHover={{ x: -2 }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 mt-0.5 transition-colors">
            <ArrowLeft size={18} />
          </motion.button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{resume.title || resume.originalName}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {resume.targetRole && <Tag>{resume.targetRole}</Tag>}
            {resume.targetCompany && <Tag>{resume.targetCompany}</Tag>}
            <StatusBadge status={resume.status} />
          </div>
        </div>
      </div>

      {!analysis ? (
        <div className="card p-10 text-center">
          <Sparkles size={40} className="mx-auto text-brand-400 mb-3" />
          <p className="text-slate-300 font-medium">No analysis yet</p>
          <p className="text-slate-500 text-sm mt-1">Analysis was not run or is still processing.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <PremiumButton icon={<Download size={15} />} onClick={handleExportReport}>Export PDF</PremiumButton>
            <PremiumButton icon={<Share2 size={15} />} onClick={handleShare}>Copy Share Link</PremiumButton>
            <PremiumButton icon={coverLetterLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} onClick={handleCoverLetter}>
              Cover Letter
            </PremiumButton>
          </div>

          {/* Score Overview */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main ring */}
            <div className="card p-6 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-slate-400 font-medium">Overall ATS Score</p>
              <ScoreRing score={Math.round(analysis.atsScore)} size={140} strokeWidth={10} />
              <p className="text-xs text-slate-500 text-center">{analysis.summary}</p>
            </div>

            {/* Sub-scores */}
            <div className="card p-6 space-y-3 lg:col-span-2">
              <p className="text-sm font-medium text-slate-300 mb-4">Score Breakdown</p>
              {subScores.map(({ label, value }) => (
                <ScoreBar key={label} label={label} value={Math.round(value)} />
              ))}
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-800)' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: activeTab === tab ? '#818cf8' : '#64748b',
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              {activeTab === 'Overview' && <OverviewTab analysis={analysis} />}
              {activeTab === 'Suggestions' && <SuggestionsTab analysis={analysis} />}
              {activeTab === 'Skills' && <SkillsTab analysis={analysis} />}
              {activeTab === 'Tailor' && (
                <TailorTab jd={jd} setJd={setJd} onTailor={handleTailor}
                  tailoring={tailoring} result={analysis.tailoredResume}
                  matchScore={analysis.matchScore} error={error} />
              )}
              {activeTab === 'Interview' && <InterviewTab analysis={analysis} />}
            </motion.div>
          </AnimatePresence>

          <AnimatedModal open={Boolean(coverLetter)} title="AI Cover Letter" onClose={() => setCoverLetter(null)}>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm leading-6 text-slate-300">
              {coverLetter}
            </pre>
          </AnimatedModal>
        </>
      )}
    </div>
  );
}

function PremiumButton({ icon, children, onClick }) {
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-brand-400/40 hover:bg-brand-500/10">
      {icon}
      {children}
    </motion.button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, value }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }} className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} />
      </div>
    </div>
  );
}

function OverviewTab({ analysis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Section title="Strengths" icon={<CheckCircle size={16} className="text-emerald-400" />}>
        <ul className="space-y-2">
          {(analysis.strengths || []).map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 mt-0.5">✓</span> {s}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Weaknesses" icon={<AlertTriangle size={16} className="text-amber-400" />}>
        <ul className="space-y-2">
          {(analysis.weaknesses || []).map((w, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-amber-400 mt-0.5">!</span> {w}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Missing Keywords" icon={<Target size={16} className="text-rose-400" />}>
        <div className="flex flex-wrap gap-2">
          {(analysis.missingKeywords || []).map((k, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-xs text-rose-300"
              style={{ background: 'rgba(244,63,94,0.12)' }}>{k}</span>
          ))}
        </div>
      </Section>
      <Section title="Found Keywords" icon={<CheckCircle size={16} className="text-brand-400" />}>
        <div className="flex flex-wrap gap-2">
          {(analysis.keywords || []).slice(0, 20).map((k, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-xs text-brand-300"
              style={{ background: 'rgba(99,102,241,0.12)' }}>{k}</span>
          ))}
        </div>
      </Section>
    </div>
  );
}

function SuggestionsTab({ analysis }) {
  const priorities = { high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };
  const grouped = (analysis.suggestions || []).reduce((acc, s) => {
    acc[s.priority] = acc[s.priority] || [];
    acc[s.priority].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {['high', 'medium', 'low'].map(p => (grouped[p]?.length ? (
        <div key={p}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: priorities[p] }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: priorities[p] }}>
              {p} Priority
            </p>
          </div>
          <div className="space-y-2">
            {grouped[p].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-4 rounded-xl"
                style={{ background: `${priorities[p]}0d`, border: `1px solid ${priorities[p]}22` }}>
                <span className="text-xs font-medium mt-0.5 px-2 py-0.5 rounded" style={{ background: `${priorities[p]}22`, color: priorities[p] }}>
                  {s.category}
                </span>
                <p className="text-sm text-slate-300">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null))}
    </div>
  );
}

function SkillsTab({ analysis }) {
  const skills = [...new Map((analysis.skills || [])
    .filter(Boolean)
    .map((skill) => [String(skill).toLowerCase(), String(skill).trim()]))
    .values()];
  const skillColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Detected Skills</h3>
            <p className="text-xs text-slate-500 mt-1">Skills found from resume sections and ATS keyword matches</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-brand-300"
            style={{ background: 'rgba(99,102,241,0.12)' }}>
            {skills.length} found
          </span>
        </div>

        {skills.length ? (
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill, i) => {
              const color = skillColors[i % skillColors.length];
              return (
                <span key={skill} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: `${color}18`, border: `1px solid ${color}35`, color: '#e2e8f0' }}>
                  {skill}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl px-4 py-5 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
            <p className="text-sm text-slate-400">No skills were confidently detected.</p>
          </div>
        )}
      </div>

      {analysis.certifications?.length > 0 && (
        <Section title="Certifications">
          <div className="flex flex-wrap gap-2">
            {analysis.certifications.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-sm text-purple-300"
                style={{ background: 'rgba(168,85,247,0.12)' }}>{c}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function TailorTab({ jd, setJd, onTailor, tailoring, result, matchScore, error }) {
  const [showResult, setShowResult] = useState(Boolean(result));
  const resultRef = useRef(null);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      setShowResult(true);
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [result]);

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Paste Job Description
        </label>
        <textarea
          rows={8} value={jd} onChange={e => setJd(e.target.value)}
          placeholder="Paste the full job description here to tailor your resume…"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none resize-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}
        <motion.button onClick={onTailor} disabled={tailoring || !jd.trim()}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand disabled:opacity-50">
          {tailoring ? <><Loader2 size={15} className="animate-spin" /> Tailoring…</> : <><FileEdit size={15} /> Tailor Resume</>}
        </motion.button>
      </div>

      {result && (
        <motion.div ref={resultRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" /> Tailored Resume
            </h3>
            {matchScore != null && (
              <span className="text-sm font-bold px-3 py-1 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                {Math.round(matchScore)}% Match
              </span>
            )}
          </div>
          <button onClick={() => setShowResult(s => !s)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            {showResult ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show tailored resume</>}
          </button>
          {showResult && (
            <pre className="text-xs text-slate-300 whitespace-pre-wrap p-4 rounded-xl overflow-auto max-h-96"
              style={{ background: 'var(--color-surface-900)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {result}
            </pre>
          )}
        </motion.div>
      )}
    </div>
  );
}

function InterviewTab({ analysis }) {
  const typeColors = { behavioral: '#6366f1', technical: '#06b6d4', situational: '#f59e0b' };
  const questions = analysis.interviewQuestions || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} className="text-brand-400" />
        <p className="text-sm text-slate-300">{questions.length} questions generated based on your resume</p>
      </div>
      {questions.map((q, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="card p-5 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: `${typeColors[q.type] || '#6366f1'}1a`, color: typeColors[q.type] || '#6366f1' }}>
              {q.type}
            </span>
            <span className="text-xs text-slate-600">Q{i + 1}</span>
          </div>
          <p className="text-sm text-white font-medium">{q.question}</p>
          {q.hint && (
            <p className="text-xs text-slate-500 italic border-l-2 pl-3"
              style={{ borderColor: typeColors[q.type] || '#6366f1' }}>
              💡 {q.hint}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg text-slate-300"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    PROCESSING: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
    FAILED: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    PENDING: { color: '#64748b', bg: 'rgba(255,255,255,0.06)' },
  };
  const { color, bg } = map[status] || map.PENDING;
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: bg, color }}>
      {status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded-xl" style={{ background: 'var(--color-surface-800)' }} />
      <div className="grid grid-cols-3 gap-5">
        {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl" style={{ background: 'var(--color-surface-800)' }} />)}
      </div>
    </div>
  );
}
