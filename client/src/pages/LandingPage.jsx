import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, Bot, CheckCircle, Gauge,
  Lock, Share2, Sparkles, Upload, Wand2
} from 'lucide-react';
import heroAsset from '../assets/hero.png';

const features = [
  { icon: Upload, title: 'Resume Uploads', text: 'Drag in PDF or DOCX resumes, validate files, parse text, and keep metadata organized.' },
  { icon: Gauge, title: 'Deterministic ATS Score', text: 'Keyword overlap, missing terms, skills, action verbs, and weighted scoring without AI-generated numbers.' },
  { icon: Bot, title: 'Gemini Suggestions', text: 'Generate improvement ideas, stronger summaries, project rewrites, tailoring, and cover letters.' },
  { icon: Share2, title: 'Premium Sharing', text: 'Export PDF reports and create public analysis links for quick review conversations.' },
];

const workflow = [
  'Upload a resume',
  'Extract sections and skills',
  'Score ATS readiness',
  'Tailor for a job',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--color-surface-950)' }}>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-white/5 bg-surface-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand glow-brand">
              <Sparkles size={20} className="text-white" />
            </span>
            <span className="text-lg font-bold text-white">Resume<span className="gradient-text">AI</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
              Login
            </Link>
            <Link to="/register" className="rounded-lg px-4 py-2 text-sm font-semibold text-white gradient-brand">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[92vh] px-5 pt-28">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `linear-gradient(rgba(10,10,15,0.35), rgba(10,10,15,0.92)), url(${heroAsset})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.22),transparent_55%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-brand-300">
              <Wand2 size={14} />
              AI-assisted resume intelligence
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.03] text-white md:text-7xl">
              ResumeAI
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              A premium resume analysis workspace for uploads, ATS scoring, skill detection, Gemini-powered improvements, tailored resumes, reports, and shareable review links.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white gradient-brand glow-brand">
                Start analyzing
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-brand-400/40 hover:bg-brand-500/10">
                Login to dashboard
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-2xl border border-white/10 bg-surface-900/70 p-4 shadow-2xl backdrop-blur-xl">
            <div className="rounded-xl border border-white/10 bg-surface-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500">ATS Readiness</p>
                  <p className="mt-1 text-3xl font-black text-white">86%</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                  <BarChart3 size={24} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ['Skills', 92, '#10b981'],
                  ['Keywords', 82, '#6366f1'],
                  ['Experience', 78, '#f59e0b'],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-semibold" style={{ color }}>{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div className="h-full rounded-full" style={{ background: color }}
                        initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ delay: 0.35, duration: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {['React', 'Node.js', 'AWS', 'PostgreSQL'].map((skill) => (
                  <span key={skill} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-sm text-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map(({ icon: Icon, title, text }, index) => (
            <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: index * 0.05 }} className="rounded-xl border border-white/10 bg-white/[0.035] p-5 transition-all hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/[0.055]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold text-brand-300">Built for real resume iteration</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">From upload to interview prep in one focused workflow.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            ResumeAI combines deterministic scoring with AI writing assistance so users can understand gaps, improve wording, tailor to job descriptions, and export polished review artifacts.
          </p>
        </div>
        <div className="grid gap-3">
          {workflow.map((step, index) => (
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: index * 0.06 }} className="flex items-center gap-4 rounded-xl border border-white/10 bg-surface-900/70 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-sm font-bold text-brand-300">{index + 1}</span>
              <span className="font-medium text-white">{step}</span>
              <CheckCircle size={18} className="ml-auto text-emerald-400" />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:flex md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="text-2xl font-black text-white">Ready to improve a resume?</h2>
            <p className="mt-2 text-sm text-slate-400">Create an account, upload a resume, and get structured analysis in minutes.</p>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white gradient-brand">
              Get started <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5">
              Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-5 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>ResumeAI</span>
          <span className="flex items-center gap-2"><Lock size={14} /> Secure resume analysis workspace</span>
        </div>
      </footer>
    </div>
  );
}
