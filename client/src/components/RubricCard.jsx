import React from 'react';
import ScorePill from './ScorePill';
import { CheckCircle2, AlertTriangle, Lightbulb, AlertCircle, Quote } from 'lucide-react';

const CRITERION_NAMES = {
  requirement_understanding: 'Requirement Understanding',
  class_responsibilities: 'Class Responsibilities',
  coupling_cohesion: 'Coupling & Cohesion',
  encapsulation_interfaces: 'Encapsulation & Interfaces',
  appropriate_abstraction: 'Appropriate Abstraction & Design Patterns',
  extensibility: 'Extensibility & Open/Closed Principle',
  edge_cases: 'Edge Cases & Robustness'
};

export default function RubricCard({ result, delta }) {
  const label = CRITERION_NAMES[result.criterion] || result.criterion;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-all space-y-4">
      {/* Header with Title, Score, and Evidence Verification Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-semibold text-base text-slate-100">{label}</h4>
          {delta && (
            <div className="text-xs">
              {/* Optional inline delta badge */}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Confidence Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
              result.confidence === 'high'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {result.confidence === 'high' ? 'High Confidence' : 'Low Confidence'}
          </span>

          {/* Evidence Verified Guard Badge */}
          {result.evidenceVerified ? (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              title="Verified: Cited quote was checked against submission text"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Verified Quote</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30"
              title="Needs Review: Quote could not be verified in submission content"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Needs Review (Unverified)</span>
            </span>
          )}

          <ScorePill score={result.score} />
        </div>
      </div>

      {/* Cited Evidence Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 relative overflow-hidden">
        <div className="flex items-start space-x-2">
          <Quote className="w-4 h-4 text-indigo-400/80 mt-0.5 shrink-0" />
          <div className="space-y-1 w-full overflow-hidden">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Cited Evidence
            </span>
            <p className="font-mono text-xs text-indigo-200 bg-slate-900/90 p-2 rounded border border-slate-800/80 break-words whitespace-pre-wrap">
              "{result.evidence}"
            </p>
          </div>
        </div>
      </div>

      {/* Concern & Suggestion Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Concern / Gap</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            {result.concern || 'None identified.'}
          </p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Actionable Suggestion</span>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            {result.suggestion || 'Keep up the good design.'}
          </p>
        </div>
      </div>
    </div>
  );
}
