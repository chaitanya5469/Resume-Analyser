import { motion } from 'framer-motion';

export default function ScoreRing({ score = 0, size = 160, strokeWidth = 12 }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const color = clampedScore >= 80 ? '#10b981'
    : clampedScore >= 60 ? '#f59e0b'
    : clampedScore >= 40 ? '#f97316'
    : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-3xl font-bold text-white"
        >
          {clampedScore}
        </motion.span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}
