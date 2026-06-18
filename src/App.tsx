import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { GameModal } from './components/GameModal';
import { CreateGameModal } from './components/CreateGameModal';
import { AuthPrompt, isAuthed } from './components/AuthPrompt';
import { fetchGames, upsertGame, deleteGame } from './api';
import type { Filters, Game } from './types';
import './index.css';

const DEFAULT_FILTERS: Filters = {
  search: '',
  ageGroups: [],
  groupSizes: [],
  setupTimes: [],
  playTimes: [],
  settings: [],
  tags: [],
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
  const [sort, setSort] = useState<'a-z' | 'z-a' | 'newest'>('a-z');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('playtabase-theme') === 'dark');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('playtabase-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    fetchGames()
      .then((loadedGames) => {
        setGames(loadedGames);
        const id = new URLSearchParams(window.location.search).get('game');
        if (id) {
          const game = loadedGames.find((g) => g.id === id);
          if (game) setSelectedGame(game);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedGame) url.searchParams.set('game', selectedGame.id);
    else url.searchParams.delete('game');
    history.replaceState(null, '', url.toString());
  }, [selectedGame]);

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
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          g.name.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q)) ||
          g.howToPlay.toLowerCase().includes(q) ||
          g.setupInstructions.toLowerCase().includes(q) ||
          g.suppliesRequired.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.ageGroups.length && !filters.ageGroups.some((ag) => g.ageGroups.includes(ag))) return false;
      if (filters.groupSizes.length && !filters.groupSizes.includes(g.groupSize)) return false;
      if (filters.setupTimes.length && !filters.setupTimes.includes(g.setupTime)) return false;
      if (filters.playTimes.length && !filters.playTimes.includes(g.playTime)) return false;
      if (filters.settings.length && !filters.settings.includes(g.setting)) return false;
      if (filters.tags.length && !filters.tags.some((t) => g.tags.includes(t))) return false;
      return true;
    });
  }, [games, filters]);

  const sorted = useMemo(() => {
    const compare = (a: Game, b: Game) => {
      if (sort === 'a-z') return a.name.localeCompare(b.name);
      if (sort === 'z-a') return b.name.localeCompare(a.name);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    };
    return [...filtered].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return compare(a, b);
    });
  }, [filtered, sort]);

  useEffect(() => { setFocusedIndex(null); }, [sorted]);

  useEffect(() => {
    if (focusedIndex === null) return;
    document.getElementById(`card-${sorted[focusedIndex]?.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex]);

  useEffect(() => {
    if (selectedGame || createOpen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? 0 : Math.min(i + 1, sorted.length - 1)));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? sorted.length - 1 : Math.max(i - 1, 0)));
      } else if (e.key === 'Enter' && focusedIndex !== null) {
        e.preventDefault();
        setSelectedGame(sorted[focusedIndex]);
      } else if (e.key === 'Escape' && focusedIndex !== null) {
        setFocusedIndex(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedGame, createOpen, focusedIndex, sorted]);

  const handleSave = (updated: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGame(updated);
    upsertGame(updated).catch((e) => console.error('Save failed:', e));
  };

  const handleTagClick = (tag: string) => {
    setFilters((f) => ({ ...f, tags: [tag] }));
    setSelectedGame(null);
  };

  const handleDelete = (game: Game) => {
    setGames((prev) => prev.filter((g) => g.id !== game.id));
    setSelectedGame(null);
    deleteGame(game.id).catch((e) => console.error('Delete failed:', e));
  };

  const handleCreate = (game: Game) => {
    setGames((prev) => [...prev, game]);
    setCreateOpen(false);
    setSelectedGame(game);
    upsertGame(game).catch((e) => console.error('Create failed:', e));
  };


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
      <section>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Games <span className="normal-case tracking-normal font-normal">({sorted.length})</span>
            </h2>
            {filters.tags.length > 0 && (
              <>
                <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                <span className="text-xs text-slate-500">Filtered by tag:</span>
                {filters.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-1 font-medium">
                    #{tag}
                    <button onClick={() => setFilters((f) => ({ ...f, tags: [] }))} className="hover:text-indigo-900 leading-none">✕</button>
                  </span>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-slate-400">Sort:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'a-z' | 'z-a' | 'newest')}
              className="text-xs border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
            >
              <option value="a-z">A–Z</option>
              <option value="z-a">Z–A</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((game, i) => (
              <GameCard key={game.id} game={game} onClick={() => setSelectedGame(game)} onTagClick={handleTagClick} focused={focusedIndex === i} />
            ))}
          </div>
        </section>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)} onCreateGame={() => requireAuth(() => setCreateOpen(true))} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} filters={filters} onChange={setFilters} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
        <main className="flex-1 overflow-y-auto p-6">{renderMain()}</main>
      </div>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSave={handleSave}
          onEditRequest={(proceed) => requireAuth(proceed)}
          onTagClick={handleTagClick}
          onDelete={() => handleDelete(selectedGame)}
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
