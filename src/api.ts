import type { Game } from './types';

const BASE = import.meta.env.VITE_API_URL as string;

export async function fetchGames(): Promise<Game[]> {
  const res = await fetch(`${BASE}/games`);
  if (!res.ok) throw new Error('Failed to load games');
  return res.json();
}

export async function upsertGame(game: Game): Promise<void> {
  const res = await fetch(`${BASE}/games/${game.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error('Failed to save game');
}

export async function deleteGame(id: string): Promise<void> {
  const res = await fetch(`${BASE}/games/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete game');
}
