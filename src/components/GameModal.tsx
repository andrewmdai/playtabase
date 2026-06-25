import { useEffect, useRef, useState } from 'react';
import type { AgeGroup, Game, GameSetting, GroupSize, TimeRange } from '../types';

interface GameModalProps {
  game: Game;
  onClose: () => void;
  onSave: (updated: Game) => void;
  onEditRequest?: (proceed: () => void) => void;
  onTagClick?: (tag: string) => void;
  onDelete?: () => void;
}

const AGE_GROUPS: AgeGroup[] = ['Children', 'Teenagers', 'Young Adults', 'Adults'];
const GROUP_SIZES: GroupSize[] = ['0-10', '10-20', '20+'];
const TIME_RANGES: TimeRange[] = ['0-15min', '15-30min', '30min+'];
const SETTINGS: GameSetting[] = ['Virtual', 'In-Person', 'Both'];

const SETTING_COLORS: Record<string, string> = {
  Virtual: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'In-Person': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Both: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

function Badge({ label, color }: { label: string; color?: string }) {
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${color ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
      {label}
    </span>
  );
}

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 resize-none';
const selectCls = 'mt-1 w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200';
const outlineBtnCls = 'text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors';

export function GameModal({ game, onClose, onSave, onEditRequest, onTagClick, onDelete }: GameModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Game>(game);
  const [tagsRaw, setTagsRaw] = useState(game.tags.join(', '));
  const [suppliesRaw, setSuppliesRaw] = useState(game.suppliesRequired.join('\n'));
  const [attempted, setAttempted] = useState(false);

  const errors = {
    name: !draft.name.trim() ? 'Required' : null,
    ageGroups: draft.ageGroups.length === 0 ? 'Select at least one age group' : null,
    howToPlay: !draft.howToPlay.trim() ? 'Required' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(`${game.name}\n\n${game.howToPlay}`);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const requestCancel = () => {
    if (editing) setShowConfirm(true);
    else onClose();
  };

  const closeDeletePrompt = () => {
    setShowDeletePrompt(false);
    setDeletePassword('');
    setDeleteError(false);
  };

  const confirmDelete = () => {
    if (deletePassword === (import.meta.env.VITE_ADMIN_PASSWORD as string)) {
      onDelete?.();
    } else {
      setDeleteError(true);
      setDeletePassword('');
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeletePrompt) closeDeletePrompt();
        else if (showConfirm) setShowConfirm(false);
        else if (editing) setShowConfirm(true);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDeletePrompt, showConfirm, editing, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) requestCancel();
  };

  const toggleAgeGroup = (ag: AgeGroup) => {
    setDraft((d) => {
      const next = d.ageGroups.includes(ag) ? d.ageGroups.filter((v) => v !== ag) : [...d.ageGroups, ag];
      return { ...d, ageGroups: AGE_GROUPS.filter((a) => next.includes(a)) };
    });
  };

  const updateTags = (raw: string) => {
    setDraft((d) => ({ ...d, tags: raw.split(',').map((s) => s.trim()).filter(Boolean) }));
  };

  const save = () => {
    setAttempted(true);
    if (hasErrors) return;
    onSave({ ...draft, suppliesRequired: suppliesRaw.split('\n').map((s) => s.trim()).filter(Boolean) });
    setEditing(false);
  };

  const discardEdits = () => {
    setDraft(game);
    setTagsRaw(game.tags.join(', '));
    setSuppliesRaw(game.suppliesRequired.join('\n'));
    setEditing(false);
    setShowConfirm(false);
  };

  const display = editing ? draft : game;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        {copiedRules && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
            Game name and rules copied
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex-1 pr-4">
            {editing ? (
              <>
                <input
                  className={`text-xl font-bold w-full border-b-2 focus:outline-none pb-0.5 bg-transparent text-slate-800 dark:text-slate-100 ${attempted && errors.name ? 'border-red-400' : 'border-indigo-400'}`}
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
                {attempted && errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </>
            ) : (
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{display.name}</h2>
            )}
            {display.featured && !editing && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                ★ Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={() => setShowDeletePrompt(true)} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                  Delete
                </button>
                <button onClick={requestCancel} className={outlineBtnCls}>
                  Cancel
                </button>
                <button onClick={save} className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="relative group">
                  <button onClick={handleCopyRules} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {copiedRules ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100">Copy rules</span>
                </div>
                <div className="relative group">
                  <button onClick={handleShare} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    )}
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100">Copy link</span>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => onEditRequest ? onEditRequest(() => setEditing(true)) : setEditing(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100">Edit</span>
                </div>
              </>
            )}
            <div className="relative group">
              <button onClick={requestCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-lg leading-none">
                ✕
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100">Close</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
          {/* Quick stats */}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <div className="w-full flex flex-col gap-3">
                <Field label="Age Groups" error={attempted ? errors.ageGroups : null}>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {AGE_GROUPS.map((ag) => (
                      <label key={ag} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.ageGroups.includes(ag)}
                          onChange={() => toggleAgeGroup(ag)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{ag}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Group Size">
                    <select value={draft.groupSize} onChange={(e) => setDraft((d) => ({ ...d, groupSize: e.target.value as GroupSize }))} className={selectCls}>
                      {GROUP_SIZES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Setting">
                    <select value={draft.setting} onChange={(e) => setDraft((d) => ({ ...d, setting: e.target.value as GameSetting }))} className={selectCls}>
                      {SETTINGS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Setup Time">
                    <select value={draft.setupTime} onChange={(e) => setDraft((d) => ({ ...d, setupTime: e.target.value as TimeRange }))} className={selectCls}>
                      {TIME_RANGES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Play Time">
                    <select value={draft.playTime} onChange={(e) => setDraft((d) => ({ ...d, playTime: e.target.value as TimeRange }))} className={selectCls}>
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
                    <span className="text-sm text-slate-600 dark:text-slate-300">Mark as featured</span>
                  </label>
                </Field>
              </div>
            ) : (
              <>
                {display.ageGroups.map((ag) => <Badge key={ag} label={ag} />)}
                <Badge label={`👥 ${display.groupSize}`} />
                <Badge label={`⏱ ${display.playTime}`} />
                <Badge label={`🔧 Setup: ${display.setupTime}`} />
                <Badge label={display.setting} color={SETTING_COLORS[display.setting]} />
              </>
            )}
          </div>

          {/* Supplies */}
          <Field label="Supplies Required">
            {editing ? (
              <textarea className={inputCls} rows={3} placeholder="One item per line..." value={suppliesRaw} onChange={(e) => setSuppliesRaw(e.target.value)} />
            ) : display.suppliesRequired.length === 0 ? (
              <p className="text-sm text-slate-400 italic">None required</p>
            ) : (
              <ul className="text-sm text-slate-600 dark:text-slate-300 list-disc list-inside flex flex-col gap-1">
                {display.suppliesRequired.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </Field>

          {/* Setup */}
          <Field label="Setup Instructions">
            {editing ? (
              <textarea className={inputCls} rows={3} value={draft.setupInstructions} onChange={(e) => setDraft((d) => ({ ...d, setupInstructions: e.target.value }))} />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{display.setupInstructions}</p>
            )}
          </Field>

          {/* How to play */}
          <Field label="How to Play" error={attempted ? errors.howToPlay : null}>
            {editing ? (
              <textarea className={inputCls} rows={6} value={draft.howToPlay} onChange={(e) => setDraft((d) => ({ ...d, howToPlay: e.target.value }))} />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{display.howToPlay}</p>
            )}
          </Field>

          {/* Tags */}
          <Field label="Tags">
            {editing ? (
              <input
                type="text"
                className={inputCls}
                placeholder="Comma-separated tags..."
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                onBlur={() => updateTags(tagsRaw)}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {display.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-2 py-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeletePrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Delete "{game.name}"?</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the admin password to permanently delete this game.</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="password"
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 ${deleteError ? 'border-red-400 focus:border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-indigo-400'}`}
                placeholder="Password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
              />
              {deleteError && <p className="text-xs text-red-500">Incorrect password.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={closeDeletePrompt} className={outlineBtnCls}>Cancel</button>
              <button onClick={confirmDelete} className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Discard confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Are you sure you want to cancel?</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your changes will be lost.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className={outlineBtnCls}>Keep editing</button>
              <button onClick={discardEdits} className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
