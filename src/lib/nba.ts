const BASE = import.meta.env.VITE_NBA_SERVICE_URL;

export async function searchPlayers(q: string) {
  const res = await fetch(`${BASE}/players/search?q=${encodeURIComponent(q)}`);
  return res.json();
}