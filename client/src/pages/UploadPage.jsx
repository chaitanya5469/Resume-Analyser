import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ title: '', targetRole: '', targetCompany: '' });
  const [status, setStatus] = useState('idle'); // idle | uploading | analyzing | done | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateAndSetFile = useCallback((f) => {
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|docx)$/i)) {
      setError('Only PDF and DOCX files are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setError('');
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }, [validateAndSetFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }

    const formData = new FormData();
    formData.append('resume', file);
    if (form.title) formData.append('title', form.title);
    if (form.targetRole) formData.append('targetRole', form.targetRole);
    if (form.targetCompany) formData.append('targetCompany', form.targetCompany);

    setStatus('uploading');
    setUploadProgress(0);
    try {
      const { data: resume } = await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      setUploadProgress(100);
      setStatus('analyzing');

      await api.post(`/analyses/resume/${resume.id}/analyze`);
      setStatus('done');

      setTimeout(() => navigate(`/resumes/${resume.id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Upload Resume</h1>
        <p className="text-slate-400 text-sm mt-1">Upload your resume for AI-powered ATS analysis and suggestions.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onSubmit={handleSubmit} className="space-y-5"
      >
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center cursor-pointer"
          style={{
            borderColor: dragging ? '#6366f1' : 'rgba(255,255,255,0.1)',
            background: dragging ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" className="hidden"
            accept=".pdf,.docx" onChange={onDrop} />

          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <FileText size={26} className="text-brand-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors">
                  <X size={14} /> Remove
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Upload size={26} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-white font-medium">Drop your resume here</p>
                  <p className="text-slate-500 text-sm mt-0.5">or click to browse - PDF or DOCX - Max 5MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Optional metadata */}
        <div className="card p-5 space-y-4">
          <p className="text-sm font-medium text-slate-300">Optional Details</p>
          {[
            { key: 'title',         label: 'Resume Title',    placeholder: 'e.g. Software Engineer Resume v2' },
            { key: 'targetRole',    label: 'Target Role',     placeholder: 'e.g. Senior Frontend Engineer' },
            { key: 'targetCompany', label: 'Target Company',  placeholder: 'e.g. Google, Stripe, Airbnb' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
              <input
                type="text" placeholder={placeholder} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={15} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicator */}
        <AnimatePresence>
          {(status === 'uploading' || status === 'analyzing' || status === 'done') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3 px-4 py-3 rounded-xl"
              style={{ background: status === 'done' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
              <div className="flex items-center gap-3">
                {status === 'done'
                  ? <CheckCircle size={18} className="text-emerald-400" />
                  : <Loader2 size={18} className="text-brand-400 animate-spin" />}
                <span className="text-sm font-medium" style={{ color: status === 'done' ? '#10b981' : '#818cf8' }}>
                  {status === 'uploading' && `Uploading resume - ${uploadProgress}%`}
                  {status === 'analyzing' && 'Parsing resume and running analysis...'}
                  {status === 'done' && 'Analysis complete! Redirecting...'}
                </span>
              </div>
              {status === 'uploading' && (
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={status === 'uploading' || status === 'analyzing' || status === 'done'}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl font-semibold text-white gradient-brand glow-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Analyze Resume
        </motion.button>
      </motion.form>
    </div>
  );
}
