import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Layers, ArrowRight, History, CheckSquare, Shield, Tag, AlertCircle } from 'lucide-react';

export default function ProblemListPage({ onSelectProblem, onViewHistory, userId }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getProblems();
      setProblems(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    if (diff === 'Easy') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (diff === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero / Overview */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Shield className="w-3.5 h-3.5" />
          <span>Evidence-Based Feedback & Deterministic Guards</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Master Low-Level Design
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed">
          Select an architectural challenge, draft your classes and pseudocode in plain text, and get instant evidence-backed evaluation across 7 industry rubric dimensions with iterative progress deltas.
        </p>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading problem challenges...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-4 flex items-center space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Failed to load problems: {error}. Make sure the backend server is running.</span>
        </div>
      )}

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {problems.map((problem) => (
          <div
            key={problem.slug}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5 transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyBadge(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {problem.requirements?.length || 0} Requirements
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {problem.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {problem.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(problem.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400 border border-slate-700/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between gap-2">
              <button
                onClick={() => onViewHistory(problem.slug)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center space-x-1"
                title="View attempt history and improvement deltas"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>

              <button
                onClick={() => onSelectProblem(problem.slug)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 group-hover:translate-x-0.5"
              >
                <span>Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
