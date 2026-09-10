import React, { useState } from 'react';
import RubricCard from './RubricCard';
import { Award, RotateCcw, History, Code, Sparkles, AlertTriangle } from 'lucide-react';

export default function EvaluationView({
  evaluation,
  submission,
  onRetry,
  onViewHistory
}) {
  const [showCode, setShowCode] = useState(false);

  if (!evaluation) return null;

  const results = evaluation.rubricResults || [];
  const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
  const maxPossible = results.length * 5;
  const avgScore = results.length ? (totalScore / results.length).toFixed(1) : 0;
  const unverifiedCount = results.filter(r => !r.evidenceVerified).length;

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Evaluation {evaluation.evaluatorType === 'deterministic' ? 'Deterministic Short-Circuit' : 'AI Architect Review'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(evaluation.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Design Assessment Results
            </h3>
          </div>

          {/* Aggregate Score Pill */}
          <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 rounded-xl px-5 py-3">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Score</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black font-mono text-indigo-400">{totalScore}</span>
                <span className="text-sm font-mono text-slate-500">/ {maxPossible}</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Average</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{avgScore} <span className="text-xs text-slate-500">/ 5.0</span></div>
            </div>
          </div>
        </div>

        {/* Unverified quotes warning banner if any */}
        {unverifiedCount > 0 && evaluation.evaluatorType === 'ai' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center space-x-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Deterministic Guard Notice:</strong> {unverifiedCount} {unverifiedCount === 1 ? 'criterion quote was' : 'criterion quotes were'} unverified in your submission text and flagged as <em>Needs Review (Low Confidence)</em>.
            </span>
          </div>
        )}

        {/* Overall Summary */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400 block mb-1.5 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            {evaluation.overallSummary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/40 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showCode ? 'Hide Submitted Code' : 'View Submitted Code'}</span>
          </button>

          <div className="flex items-center space-x-2.5">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors flex items-center space-x-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Attempt History & Deltas</span>
              </button>
            )}

            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry (New Attempt)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Submitted Code */}
      {showCode && submission && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="text-[11px] uppercase font-semibold text-slate-500 mb-2">
            Submitted Pseudocode (Content Hash: {submission.contentHash?.slice(0, 12)}...)
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">{submission.content}</pre>
        </div>
      )}

      {/* Rubric Dimensions Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Detailed Rubric Breakdown ({results.length} Dimensions)</span>
          </h4>
          <span className="text-xs text-slate-400">Scores 0-5 with cited evidence quotes</span>
        </div>

        <div className="space-y-3.5">
          {results.map((result) => (
            <RubricCard key={result.criterion} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}
