import type { AgeGroup, Filters, GameSetting, GroupSize, TimeRange } from '../types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const AGE_GROUPS: AgeGroup[] = ['Children', 'Teenagers', 'Young Adults', 'Adults'];
const GROUP_SIZES: GroupSize[] = ['0-10', '10-20', '20+'];
const TIME_RANGES: TimeRange[] = ['0-15min', '15-30min', '30min+'];
const SETTINGS: GameSetting[] = ['Virtual', 'In-Person', 'Both'];

function CheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (val: T[]) => void;
}) {
  const toggle = (opt: T) => {
    onChange(selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt]);
  };

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="w-4 h-4 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800 cursor-pointer"
            />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, filters, onChange, darkMode, onToggleDark }: SidebarProps) {
  const reset = () =>
    onChange({ search: '', ageGroups: [], groupSizes: [], setupTimes: [], playTimes: [], settings: [], tags: [] });

  const hasFilters = !!(
    filters.search ||
    filters.ageGroups.length ||
    filters.groupSizes.length ||
    filters.setupTimes.length ||
    filters.playTimes.length ||
    filters.settings.length
  );

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside
        className={`bg-slate-800 text-white flex flex-col shrink-0 border-r border-slate-700
          fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300
          lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:transition-[width] lg:overflow-hidden
          ${open ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-0'}`}
      >
      <div className="p-4 overflow-y-auto flex-1 min-w-64 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Filters</h2>
          {hasFilters && (
            <button
              onClick={reset}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Search</p>
          <input
            type="text"
            placeholder="Game name..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <CheckboxGroup
          label="Age Group"
          options={AGE_GROUPS}
          selected={filters.ageGroups}
          onChange={(v) => onChange({ ...filters, ageGroups: v })}
        />
        <CheckboxGroup
          label="Group Size"
          options={GROUP_SIZES}
          selected={filters.groupSizes}
          onChange={(v) => onChange({ ...filters, groupSizes: v })}
        />
        <CheckboxGroup
          label="Setup Time"
          options={TIME_RANGES}
          selected={filters.setupTimes}
          onChange={(v) => onChange({ ...filters, setupTimes: v })}
        />
        <CheckboxGroup
          label="Play Time"
          options={TIME_RANGES}
          selected={filters.playTimes}
          onChange={(v) => onChange({ ...filters, playTimes: v })}
        />
        <CheckboxGroup
          label="Setting"
          options={SETTINGS}
          selected={filters.settings}
          onChange={(v) => onChange({ ...filters, settings: v })}
        />
        <div className="mt-auto pt-4 border-t border-slate-700">
          <button
            onClick={onToggleDark}
            className="flex items-center gap-2 w-full text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span>{darkMode ? '☀' : '☽'}</span>
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
