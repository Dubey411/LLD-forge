import React from 'react';
import { Layers, Terminal, User, BookOpen } from 'lucide-react';

export default function Navbar({ currentView, onNavigate, userId, setUserId }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('problems')}>
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">LLD Studio</span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">Low-Level Design Practice & Evidence-Based Rubrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('problems')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
              currentView === 'problems'
                ? 'bg-slate-800 text-white text-indigo-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Problem Catalog</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">User:</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value || 'demo-user')}
              className="bg-transparent text-xs font-mono text-indigo-300 border-none outline-none w-24 focus:ring-0"
              title="Change User ID for multi-user practice loops"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
