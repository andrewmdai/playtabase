import { useEffect, useRef, useState } from 'react';
import type { AgeGroup, Game, GameSetting, GroupSize, TimeRange } from '../types';

interface CreateGameModalProps {
  games: Game[];
  onClose: () => void;
  onCreate: (game: Game) => void;
}

const AGE_GROUPS: AgeGroup[] = ['Children', 'Teenagers', 'Young Adults', 'Adults'];
const GROUP_SIZES: GroupSize[] = ['0-10', '10-20', '20+'];
const TIME_RANGES: TimeRange[] = ['0-15min', '15-30min', '30min+'];
const SETTINGS: GameSetting[] = ['Virtual', 'In-Person', 'Both'];

const EMPTY_DRAFT = {
  name: '',
  ageGroups: [] as AgeGroup[],
  groupSize: '0-10' as GroupSize,
  setupTime: '0-15min' as TimeRange,
  playTime: '0-15min' as TimeRange,
  setting: 'In-Person' as GameSetting,
  suppliesRequired: [] as string[],
  setupInstructions: '',
  howToPlay: '',
  tags: [] as string[],
  featured: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      {children}
    </div>
  );
}

export function CreateGameModal({ games, onClose, onCreate }: CreateGameModalProps) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showCopySearch, setShowCopySearch] = useState(false);
  const [copySearch, setCopySearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDirty =
    draft.name.trim() !== '' ||
    draft.ageGroups.length > 0 ||
    draft.suppliesRequired.length > 0 ||
    draft.setupInstructions !== '' ||
    draft.howToPlay !== '' ||
    draft.tags.length > 0;

  const requestClose = () => {
    if (isDirty) setShowConfirm(true);
    else onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirm) setShowConfirm(false);
        else requestClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showConfirm, isDirty]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (showCopySearch) searchInputRef.current?.focus();
  }, [showCopySearch]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) requestClose();
  };

  const toggleAgeGroup = (ag: AgeGroup) => {
    setDraft((d) => {
      const next = d.ageGroups.includes(ag) ? d.ageGroups.filter((v) => v !== ag) : [...d.ageGroups, ag];
      return { ...d, ageGroups: AGE_GROUPS.filter((a) => next.includes(a)) };
    });
  };

  const copyFrom = (game: Game) => {
    const { id: _id, ...rest } = game;
    setDraft(rest);
    setShowCopySearch(false);
    setCopySearch('');
  };

  const save = () => {
    if (!draft.name.trim()) return;
    const slug = draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    onCreate({ ...draft, id: `${slug}-${Date.now()}` });
  };

  const searchResults = games.filter((g) =>
    g.name.toLowerCase().includes(copySearch.toLowerCase())
  );

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <input
              autoFocus
              className="text-xl font-bold text-slate-800 w-full border-b-2 border-indigo-400 focus:outline-none pb-0.5 placeholder:font-normal placeholder:text-slate-300"
              placeholder="Game name..."
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCopySearch((v) => !v)}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Copy from…
            </button>
            <button
              onClick={requestClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Copy-from search panel */}
        {showCopySearch && (
          <div className="px-6 pt-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 pr-8"
                placeholder="Search for a game to copy from..."
                value={copySearch}
                onChange={(e) => setCopySearch(e.target.value)}
              />
              <button
                onClick={() => { setShowCopySearch(false); setCopySearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm leading-none"
              >
                ✕
              </button>
            </div>
            {copySearch && searchResults.length === 0 ? (
              <p className="text-sm text-slate-400 mt-2 px-1 pb-2">No games found</p>
            ) : searchResults.length > 0 ? (
              <ul className="mt-1.5 mb-1 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto shadow-sm">
                {searchResults.map((g) => (
                  <li key={g.id}>
                    <button
                      onClick={() => copyFrom(g)}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors"
                    >
                      <span className="font-medium">{g.name}</span>
                      <span className="text-slate-400 ml-2 text-xs">{g.setting} · {g.groupSize}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          <Field label="Age Groups">
            <div className="flex flex-wrap gap-2 mt-1">
              {AGE_GROUPS.map((ag) => (
                <label key={ag} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.ageGroups.includes(ag)}
                    onChange={() => toggleAgeGroup(ag)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span className="text-sm text-slate-600">{ag}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Group Size">
              <select
                value={draft.groupSize}
                onChange={(e) => setDraft((d) => ({ ...d, groupSize: e.target.value as GroupSize }))}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400"
              >
                {GROUP_SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Setting">
              <select
                value={draft.setting}
                onChange={(e) => setDraft((d) => ({ ...d, setting: e.target.value as GameSetting }))}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400"
              >
                {SETTINGS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Setup Time">
              <select
                value={draft.setupTime}
                onChange={(e) => setDraft((d) => ({ ...d, setupTime: e.target.value as TimeRange }))}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400"
              >
                {TIME_RANGES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Play Time">
              <select
                value={draft.playTime}
                onChange={(e) => setDraft((d) => ({ ...d, playTime: e.target.value as TimeRange }))}
                className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400"
              >
                {TIME_RANGES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Featured">
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-sm text-slate-600">Mark as featured</span>
            </label>
          </Field>

          <Field label="Supplies Required">
            <textarea
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none"
              rows={3}
              placeholder="One item per line..."
              value={draft.suppliesRequired.join('\n')}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  suppliesRequired: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
          </Field>

          <Field label="Setup Instructions">
            <textarea
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none"
              rows={3}
              value={draft.setupInstructions}
              onChange={(e) => setDraft((d) => ({ ...d, setupInstructions: e.target.value }))}
            />
          </Field>

          <Field label="How to Play">
            <textarea
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none"
              rows={6}
              value={draft.howToPlay}
              onChange={(e) => setDraft((d) => ({ ...d, howToPlay: e.target.value }))}
            />
          </Field>

          <Field label="Tags">
            <input
              type="text"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
              placeholder="Comma-separated tags..."
              value={draft.tags.join(', ')}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={requestClose}
            className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!draft.name.trim()}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Game
          </button>
        </div>
      </div>

      {/* Discard confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-slate-800">Are you sure you want to cancel?</p>
              <p className="text-sm text-slate-500 mt-1">Your progress will be lost.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Keep editing
              </button>
              <button
                onClick={onClose}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
