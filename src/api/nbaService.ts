const API_BASE = import.meta.env.VITE_NBA_SERVICE_URL ?? 'http://127.0.0.1:8000'

export async function searchPlayers(q: string) {
  const res = await fetch(`${API_BASE}/players/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Failed to search players')
  return res.json() as Promise<{ data: any[] }>
}
