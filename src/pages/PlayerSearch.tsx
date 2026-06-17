import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_NBA_SERVICE_URL ?? 'http://127.0.0.1:8001'

type Player = {
  id: number
  full_name: string
  first_name?: string
  last_name?: string
  is_active?: boolean
}

export default function PlayerSearch() {
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [results, setResults] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function onSearch() {
    const query = q.trim()
    if (!query) return

    setLoading(true)
    setError(null)
    setResults([])
    setSearched(true)

    try {
      const res = await fetch(
        `${API_BASE}/players/search?q=${encodeURIComponent(query)}&limit=25`
      )
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResults(data.data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to search players')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full max-w-2xl mx-auto'>
      {/* Hero */}
      <div className='text-center mb-10'>
        <p className='text-slate-400 text-lg'>
          Search any NBA player to see their game log, fantasy breakdown, and performance
          stats.
        </p>
      </div>

      {/* Search Bar */}
      <div className='flex gap-2 mb-8'>
        <div className='relative flex-1'>
          <span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg'>
            🔍
          </span>
          <input
            className='w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder='Search player (e.g. LeBron, Curry, Jokić...)'
            autoFocus
          />
        </div>
        <button
          className='px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors text-base'
          onClick={onSearch}
          disabled={loading}
          type='button'
        >
          {loading ? <span className='animate-pulse'>Searching...</span> : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className='bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4 text-red-400'>
          Error: {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className='text-slate-500 text-xs uppercase tracking-wider mb-3'>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{q}"
          </p>
          <div className='space-y-2'>
            {results.map((p) => (
              <div
                key={p.id}
                className='flex items-center justify-between p-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 cursor-pointer transition-all border border-slate-700/60 hover:border-slate-500 group'
                onClick={() => navigate(`/player/${p.id}`)}
              >
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm group-hover:bg-blue-600 transition-colors'>
                    {p.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className='font-semibold text-white'>{p.full_name}</div>
                    <div className='text-xs text-slate-500'>
                      {p.is_active ? (
                        <span className='text-green-400'>● Active</span>
                      ) : (
                        <span className='text-slate-500'>● Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className='text-slate-500 group-hover:text-blue-400 transition-colors text-lg'>
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <div className='text-center py-12'>
          <div className='text-4xl mb-3'>🏀</div>
          <p className='text-slate-400'>No players found for "{q}"</p>
          <p className='text-slate-600 text-sm mt-1'>Try a different name or spelling</p>
        </div>
      )}

      {/* Initial state */}
      {!searched && (
        <div className='text-center py-12 text-slate-600'>
          <div className='text-5xl mb-4'>🏀</div>
          <p>Start by searching for a player above</p>
        </div>
      )}
    </div>
  )
}
