import { useEffect, useState } from 'react';

const SESSION_KEY = 'playtabase_auth';

interface AuthPromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AuthPrompt({ onSuccess, onCancel }: AuthPromptProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === (import.meta.env.VITE_PASSWORD as string)) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onSuccess();
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-5">
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Password required</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the password to make changes.</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="password"
            className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none transition-colors bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 ${
              error ? 'border-red-400 focus:border-red-400' : 'border-slate-200 dark:border-slate-600 focus:border-indigo-400'
            }`}
            placeholder="Password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
          />
          {error && <p className="text-xs text-red-500 -mt-1">Incorrect password.</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function isAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
