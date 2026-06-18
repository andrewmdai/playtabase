import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { CreateGameModal } from './components/CreateGameModal';
import { AuthPrompt, isAuthed } from './components/AuthPrompt';
import { fetchGames, upsertGame } from './api';
import type { Filters, Game } from './types';
import './index.css';

const DEFAULT_FILTERS: Filters = {
  search: '',
  ageGroups: [],
  groupSizes: [],
  setupTimes: [],
  playTimes: [],
  settings: [],
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [authed, setAuthed] = useState(isAuthed);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const requireAuth = (action: () => void) => {
    if (authed) action();
    else setPendingAction(() => action);
  };

  const handleAuthSuccess = () => {
    setAuthed(true);
    pendingAction?.();
    setPendingAction(null);
  };

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (filters.search && !g.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.ageGroups.length && !filters.ageGroups.some((ag) => g.ageGroups.includes(ag))) return false;
      if (filters.groupSizes.length && !filters.groupSizes.includes(g.groupSize)) return false;
      if (filters.setupTimes.length && !filters.setupTimes.includes(g.setupTime)) return false;
      if (filters.playTimes.length && !filters.playTimes.includes(g.playTime)) return false;
      if (filters.settings.length && !filters.settings.includes(g.setting)) return false;
      return true;
    });
  }, [games, filters]);

  const handleSave = (updated: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGame(updated);
    upsertGame(updated).catch((e) => console.error('Save failed:', e));
  };

  const handleCreate = (game: Game) => {
    setGames((prev) => [...prev, game]);
    setCreateOpen(false);
    setSelectedGame(game);
    upsertGame(game).catch((e) => console.error('Create failed:', e));
  };

  const featured = filtered.filter((g) => g.featured);
  const rest = filtered.filter((g) => !g.featured);

  const renderMain = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400">
          <p className="text-sm">Loading games...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm font-medium text-red-500">{error}</p>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
          <span className="text-5xl">🎲</span>
          <p className="text-lg font-medium">No games match your filters</p>
          <p className="text-sm">Try adjusting or clearing the filters</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-8">
        {featured.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Featured
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map((game) => (
                <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} />
              ))}
            </div>
          </section>
        )}
        {rest.length > 0 && (
          <section>
            {featured.length > 0 && (
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                All Games
              </h2>
            )}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((game) => (
                <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} onCreateGame={() => requireAuth(() => setCreateOpen(true))} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} filters={filters} onChange={setFilters} />
        <main className="flex-1 overflow-y-auto p-6">{renderMain()}</main>
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSave={handleSave}
          onEditRequest={(proceed) => requireAuth(proceed)}
        />
      )}

      {createOpen && (
        <CreateGameModal
          games={games}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {pendingAction && (
        <AuthPrompt
          onSuccess={handleAuthSuccess}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
