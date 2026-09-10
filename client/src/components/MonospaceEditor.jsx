import React from 'react';
import { Send, Sparkles, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function MonospaceEditor({
  content,
  onChange,
  onSubmit,
  isSubmitting,
  problemTitle,
  onLoadTemplate
}) {
  const charCount = (content || '').trim().length;
  const hasMinChars = charCount >= 100;
  const hasClass = /\bclass\b/i.test(content);
  const hasInterface = /\binterface\b/i.test(content);
  const hasEntity = /\b[A-Z][a-zA-Z0-9_]{2,}\b/.test(content);
  const structuralMatches = [hasClass, hasInterface, hasEntity].filter(Boolean).length;
  const passesDeterministicGate = hasMinChars && structuralMatches >= 2;

  // Handle Tab key insertion for convenient code indentation
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newContent);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Editor Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Plain Text / Pseudocode
          </span>
          <span className="text-xs text-slate-500">· Tab indentation supported</span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {onLoadTemplate && (
            <button
              onClick={onLoadTemplate}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Template</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5 font-mono">
            <span className={hasMinChars ? 'text-emerald-400' : 'text-amber-400'}>
              {charCount}
            </span>
            <span className="text-slate-500">/ 100 min chars</span>
          </div>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 min-h-[420px]">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`// Write your Low-Level Design / Pseudocode solution here for: ${problemTitle}
// Include class definitions, member attributes, methods, interfaces, and design patterns.
// Example:
// class Vehicle { ... }
// interface IParkingStrategy { ... }
// class ParkingLot { ... }`}
          className="w-full h-full p-4 bg-slate-950 font-mono text-sm text-slate-100 placeholder-slate-600 border-none outline-none resize-none leading-relaxed focus:ring-0 selection:bg-indigo-600 selection:text-white"
          spellCheck={false}
          autoFocus
        />
      </div>

      {/* Footer Validation Bar & Submit Button */}
      <div className="bg-slate-950/90 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Real-time Deterministic Guard Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1 ${hasMinChars ? 'text-emerald-400' : 'text-slate-500'}`}>
            {hasMinChars ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>Length ≥ 100</span>
          </div>

          <div className={`flex items-center space-x-1 ${hasClass ? 'text-emerald-400' : 'text-slate-500'}`}>
            {hasClass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">·</span>}
            <span>"class"</span>
          </div>

          <div className={`flex items-center space-x-1 ${hasInterface ? 'text-emerald-400' : 'text-slate-500'}`}>
            {hasInterface ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">·</span>}
            <span>"interface"</span>
          </div>

          <div className={`flex items-center space-x-1 ${hasEntity ? 'text-emerald-400' : 'text-slate-500'}`}>
            {hasEntity ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 text-center">·</span>}
            <span>PascalCase Entity</span>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center space-x-2">
          {!passesDeterministicGate && charCount > 0 && (
            <span className="text-[11px] text-amber-400">
              Needs min 100 chars & 2 OOP markers to pass deterministic check
            </span>
          )}

          <button
            onClick={onSubmit}
            disabled={isSubmitting || charCount === 0}
            className={`px-5 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all shadow-lg ${
              isSubmitting
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                : charCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Solution</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
