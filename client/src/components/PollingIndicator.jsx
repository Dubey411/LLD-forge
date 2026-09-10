import React from 'react';
import { Loader2, BrainCircuit, ShieldCheck, Scale } from 'lucide-react';

export default function PollingIndicator({ status }) {
  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-violet-500/10 to-indigo-500/5 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 py-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 text-white shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Evaluating Submission
          </h3>
          <p className="text-sm text-slate-400 max-w-md">
            Status: <span className="font-mono text-indigo-300 uppercase font-semibold">{status}</span>.
            Evaluating your Low-Level Design against 7 rubric dimensions and verifying cited evidence.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm pt-2">
          <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg flex items-center justify-center space-x-1.5 text-xs text-slate-300">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rubric Matrix</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg flex items-center justify-center space-x-1.5 text-xs text-slate-300">
            <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
            <span>AI Judgement</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg flex items-center justify-center space-x-1.5 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evidence Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
