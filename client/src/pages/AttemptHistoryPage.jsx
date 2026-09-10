import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import DeltaBadge from '../components/DeltaBadge';
import ScorePill from '../components/ScorePill';
import { ArrowLeft, History, RotateCcw, TrendingUp, Calendar, Code, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function AttemptHistoryPage({ problemSlug, onBack, onStartAttempt, userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [problemSlug, userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAttemptHistory(problemSlug, userId);
      setHistory(data || []);
      // Expand latest attempt by default if exists
      if (data && data.length > 0) {
        setExpandedAttempt(data[0]._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (attemptId) => {
    setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Attempt History & Learning Deltas</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                {problemSlug}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tracking rubric score progressions for learner: <span className="font-mono text-indigo-300">{userId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => onStartAttempt(problemSlug)}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Attempt</span>
        </button>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading attempt progression history...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 flex items-center space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>Failed to load attempt history: {error}</span>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Attempts Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't submitted any designs for this challenge yet. Start your first attempt to set your baseline score.
          </p>
          <button
            onClick={() => onStartAttempt(problemSlug)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
          >
            Start First Attempt
          </button>
        </div>
      )}

      {/* Attempts Timeline */}
      <div className="space-y-6">
        {history.map((attempt) => {
          const evalDoc = attempt.evaluation;
          const deltas = attempt.deltas || [];
          const totalScore = evalDoc?.rubricResults
            ? evalDoc.rubricResults.reduce((acc, r) => acc + (r.score || 0), 0)
            : null;
          const isExpanded = expandedAttempt === attempt._id;

          return (
            <div
              key={attempt._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
            >
              {/* Attempt Summary Bar */}
              <div
                onClick={() => toggleExpand(attempt._id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                    #{attempt.attemptNumber || 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-white">
                        Attempt #{attempt.attemptNumber || 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        attempt.status === 'submitted'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {attempt.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(attempt.startedAt).toLocaleString()}</span>
                      {evalDoc && (
                        <span>· Evaluator: <strong className="text-slate-300">{evalDoc.evaluatorType}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {totalScore !== null && (
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Score</div>
                      <div className="font-mono text-xl font-bold text-indigo-400">
                        {totalScore} <span className="text-xs text-slate-500">/ 35</span>
                      </div>
                    </div>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details: Learning Deltas & Rubric Matrix */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 space-y-6">
                  {/* Executive Summary */}
                  {evalDoc?.overallSummary && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block mb-1">
                        Executive Summary
                      </span>
                      {evalDoc.overallSummary}
                    </div>
                  )}

                  {/* Per-Criterion Learning Deltas */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">
                        Rubric Progression Deltas (vs. Preceding Attempt)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {deltas.map((d) => (
                        <div
                          key={d.criterion}
                          className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-200 block">{d.label}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Current: {d.currentScore !== null ? `${d.currentScore}/5` : 'N/A'}
                            </span>
                          </div>
                          <DeltaBadge delta={d} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submitted Code Preview */}
                  {attempt.submission && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Submitted Solution Content</span>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs font-mono text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {attempt.submission.content}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
