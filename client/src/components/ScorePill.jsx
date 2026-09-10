import React from 'react';

export default function ScorePill({ score }) {
  const getStyle = (s) => {
    if (s >= 5) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (s >= 4) return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    if (s >= 3) return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    if (s >= 2) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  const getLabel = (s) => {
    if (s >= 5) return 'Exceptional';
    if (s >= 4) return 'Strong';
    if (s >= 3) return 'Acceptable';
    if (s >= 2) return 'Needs Work';
    if (s >= 1) return 'Flawed';
    return 'Missing';
  };

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyle(score)}`}>
      <span className="font-mono text-sm font-bold">{score}</span>
      <span className="text-slate-500">/5</span>
      <span className="font-sans font-medium text-slate-300">· {getLabel(score)}</span>
    </span>
  );
}
