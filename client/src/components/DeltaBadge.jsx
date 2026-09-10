import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react';

export default function DeltaBadge({ delta }) {
  if (!delta) return null;

  if (delta.direction === 'baseline') {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        <Sparkles className="w-3 h-3" />
        <span>First Attempt (Baseline)</span>
      </span>
    );
  }

  if (delta.direction === 'improved') {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <ArrowUpRight className="w-3.5 h-3.5" />
        <span>{delta.formatted}</span>
      </span>
    );
  }

  if (delta.direction === 'regressed') {
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <ArrowDownRight className="w-3.5 h-3.5" />
        <span>{delta.formatted}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
      <Minus className="w-3.5 h-3.5" />
      <span>{delta.formatted}</span>
    </span>
  );
}
