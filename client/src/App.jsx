import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ProblemListPage from './pages/ProblemListPage';
import PracticePage from './pages/PracticePage';
import AttemptHistoryPage from './pages/AttemptHistoryPage';

export default function App() {
  const [view, setView] = useState('problems'); // 'problems' | 'practice' | 'history'
  const [selectedSlug, setSelectedSlug] = useState('parking-lot');
  const [userId, setUserId] = useState('demo-user');

  const handleSelectProblem = (slug) => {
    setSelectedSlug(slug);
    setView('practice');
  };

  const handleViewHistory = (slug) => {
    setSelectedSlug(slug);
    setView('history');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans">
      <Navbar
        currentView={view}
        onNavigate={(v) => setView(v)}
        userId={userId}
        setUserId={setUserId}
      />

      <main className="flex-1">
        {view === 'problems' && (
          <ProblemListPage
            onSelectProblem={handleSelectProblem}
            onViewHistory={handleViewHistory}
            userId={userId}
          />
        )}

        {view === 'practice' && (
          <PracticePage
            problemSlug={selectedSlug}
            onBack={() => setView('problems')}
            onViewHistory={(slug) => handleViewHistory(slug)}
            userId={userId}
          />
        )}

        {view === 'history' && (
          <AttemptHistoryPage
            problemSlug={selectedSlug}
            onBack={() => setView('practice')}
            onStartAttempt={(slug) => handleSelectProblem(slug)}
            userId={userId}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>LLD Practice Platform MVP · Evidence-Based Evaluation & Per-Criterion Learning Deltas</p>
      </footer>
    </div>
  );
}
