import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
}

const SETTING_COLORS: Record<string, string> = {
  Virtual: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'In-Person': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Both: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function GameCard({ game, onClick, onTagClick }: GameCardProps) {
  const isNew = !!game.createdAt && Date.now() - game.createdAt < THIRTY_DAYS;
  return (
    <article
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col"
    >
      {game.featured && (
        <div className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
          <span>★</span>
          <span>Featured</span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors leading-tight flex items-center gap-2">
            {game.name}
            {isNew && <span className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full px-2 py-0.5 shrink-0">New</span>}
          </h3>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {game.ageGroups.map((ag) => (
              <span key={ag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5">
                {ag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>👥</span>
            <span>{game.groupSize} people</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>⏱</span>
            <span>{game.playTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔧</span>
            <span>Setup: {game.setupTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${SETTING_COLORS[game.setting]}`}>
              {game.setting}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
          {game.howToPlay}
        </p>

        {game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-700">
            {game.tags.slice(0, 4).map((tag) => (
              <button
                key={tag}
                onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                className="text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-1.5 py-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                #{tag}
              </button>
            ))}
            {game.tags.length > 4 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">+{game.tags.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
