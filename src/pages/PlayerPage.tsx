import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const API_BASE = import.meta.env.VITE_NBA_SERVICE_URL ?? 'http://127.0.0.1:8000'

type ScoringSettings = {
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  tov: number
  fg3m: number
  ftm: number
  fta: number
}

type FantasySummary = {
  player_id: number
  season: string
  window: number
  scoring: ScoringSettings
  games_count: number
  fppg: number
  last_n: number
  last_n_fppg: number
  trend_pct: number
  volatility_std: number
  floor_p20: number
  ceiling_p80: number
}

type GameRow = {
  date?: string
  matchup?: string
  wl?: string
  minutes?: number | null
  pts?: number
  reb?: number
  ast?: number
  stl?: number
  blk?: number
  tov?: number
  fg3m?: number
  ftm?: number
  fta?: number
  fantasy_points?: number
}

type ShotData = {
  LOC_X: number
  LOC_Y: number
  SHOT_MADE_FLAG: number
  SHOT_TYPE: string
  ACTION_TYPE: string
  SHOT_ZONE_BASIC: string
}

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: string
}) => (
  <div className='bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-1'>
    <div className='text-slate-500 text-xs uppercase tracking-wider'>{label}</div>
    <div className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
  </div>
)

function PerformanceChart({ games }: { games: GameRow[] }) {
  const data = [...games].reverse().map((g, i) => ({
    game: i + 1,
    fp: g.fantasy_points ?? 0,
    pts: g.pts ?? 0,
    date: g.date ?? '',
    matchup: g.matchup ?? '',
    wl: g.wl ?? '',
  }))

  const avg = data.length
    ? Math.round(data.reduce((sum, g) => sum + g.fp, 0) / data.length)
    : 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className='bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm shadow-xl'>
        <div className='text-slate-400 text-xs mb-1'>
          {d.date} — {d.matchup}
        </div>
        <div
          className={`text-xs font-bold mb-2 ${d.wl === 'W' ? 'text-green-400' : 'text-red-400'}`}
        >
          {d.wl === 'W' ? 'WIN' : 'LOSS'}
        </div>
        <div className='text-white font-bold text-lg'>{d.fp} FP</div>
        <div className='text-slate-400 text-xs'>{d.pts} PTS</div>
      </div>
    )
  }

  return (
    <div className='bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-lg font-semibold text-white'>Performance Chart</h2>
          <p className='text-slate-400 text-sm mt-0.5'>
            Fantasy points per game — full season
          </p>
        </div>
        <div className='text-right'>
          <div className='text-slate-500 text-xs uppercase tracking-wider'>
            Season Avg
          </div>
          <div className='text-white font-bold text-xl'>{avg} FP</div>
        </div>
      </div>
      <ResponsiveContainer width='100%' height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' />
          <XAxis
            dataKey='game'
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Game #',
              position: 'insideBottom',
              offset: -2,
              fill: '#475569',
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avg}
            stroke='#475569'
            strokeDasharray='4 4'
            label={{
              value: `Avg ${avg}`,
              fill: '#64748b',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
          <Line
            type='monotone'
            dataKey='fp'
            stroke='#3b82f6'
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props
              return (
                <circle
                  key={payload.game}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={payload.wl === 'W' ? '#4ade80' : '#f87171'}
                  stroke='none'
                />
              )
            }}
            activeDot={{ r: 5, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className='flex gap-4 mt-4 justify-center text-xs text-slate-400'>
        <span className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-green-400 inline-block'></span> Win
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='w-2.5 h-2.5 rounded-full bg-red-400 inline-block'></span> Loss
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='w-6 border-t border-dashed border-slate-500 inline-block'></span>{' '}
          Season Average
        </span>
      </div>
    </div>
  )
}

function ShotChart({ playerId }: { playerId: number }) {
  const [shots, setShots] = useState<ShotData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | '2pt' | '3pt'>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/players/${playerId}/shotchart`)
        const data = await res.json()
        setShots(data.data ?? [])
      } catch {
        setShots([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [playerId])

  const filtered = shots.filter((s) => {
    if (filter === '2pt') return s.SHOT_TYPE === '2PT Field Goal'
    if (filter === '3pt') return s.SHOT_TYPE === '3PT Field Goal'
    return true
  })

  const made = filtered.filter((s) => s.SHOT_MADE_FLAG === 1).length
  const pct = filtered.length > 0 ? Math.round((made / filtered.length) * 100) : 0

  const W = 500
  const H = 470
  const toSvgX = (x: number) => x + 250
  const toSvgY = (y: number) => H - (y + 50)

  return (
    <div className='bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8'>
      <div className='flex items-center justify-between mb-4 flex-wrap gap-3'>
        <div>
          <h2 className='text-lg font-semibold text-white'>Shot Chart</h2>
          <p className='text-slate-400 text-sm mt-0.5'>
            {filtered.length} shots • {made} made • {pct}% FG
          </p>
        </div>
        <div className='flex gap-2'>
          {(['all', '2pt', '3pt'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === '2pt' ? '2PT' : '3PT'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className='flex items-center justify-center py-16 text-slate-400 animate-pulse'>
          Loading shot chart...
        </div>
      ) : (
        <>
          <div className='w-full overflow-x-auto'>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className='w-full max-w-lg mx-auto block'
              style={{ background: '#0f172a', borderRadius: '12px' }}
            >
              <rect x='0' y='0' width={W} height={H} fill='#0f172a' />
              <line x1='0' y1={H} x2={W} y2={H} stroke='#334155' strokeWidth='2' />
              <line x1='0' y1='0' x2='0' y2={H} stroke='#334155' strokeWidth='2' />
              <line x1={W} y1='0' x2={W} y2={H} stroke='#334155' strokeWidth='2' />
              <rect
                x={toSvgX(-80)}
                y={toSvgY(190)}
                width={160}
                height={190 + 50}
                fill='none'
                stroke='#334155'
                strokeWidth='1.5'
              />
              <rect
                x={toSvgX(-60)}
                y={toSvgY(190)}
                width={120}
                height={190 + 50}
                fill='#1e293b'
                stroke='#334155'
                strokeWidth='1'
              />
              <ellipse
                cx={toSvgX(0)}
                cy={toSvgY(190)}
                rx={60}
                ry={60}
                fill='none'
                stroke='#334155'
                strokeWidth='1.5'
              />
              <path
                d={`M ${toSvgX(-40)} ${toSvgY(0)} A 40 40 0 0 1 ${toSvgX(40)} ${toSvgY(0)}`}
                fill='none'
                stroke='#475569'
                strokeWidth='1.5'
              />
              <circle
                cx={toSvgX(0)}
                cy={toSvgY(0)}
                r={7}
                fill='none'
                stroke='#f97316'
                strokeWidth='2'
              />
              <line
                x1={toSvgX(-30)}
                y1={toSvgY(0)}
                x2={toSvgX(30)}
                y2={toSvgY(0)}
                stroke='#f97316'
                strokeWidth='2'
              />
              <path
                d={`M ${toSvgX(-220)} ${toSvgY(0)} L ${toSvgX(-220)} ${toSvgY(90)} A 237 237 0 0 1 ${toSvgX(220)} ${toSvgY(90)} L ${toSvgX(220)} ${toSvgY(0)}`}
                fill='none'
                stroke='#334155'
                strokeWidth='1.5'
              />
              <line
                x1={toSvgX(-220)}
                y1={toSvgY(0)}
                x2={toSvgX(-220)}
                y2={toSvgY(90)}
                stroke='#334155'
                strokeWidth='1.5'
              />
              <line
                x1={toSvgX(220)}
                y1={toSvgY(0)}
                x2={toSvgX(220)}
                y2={toSvgY(90)}
                stroke='#334155'
                strokeWidth='1.5'
              />
              {filtered.map((s, i) => (
                <circle
                  key={i}
                  cx={toSvgX(s.LOC_X)}
                  cy={toSvgY(s.LOC_Y)}
                  r={4}
                  fill={s.SHOT_MADE_FLAG === 1 ? '#4ade80' : '#f87171'}
                  fillOpacity={0.7}
                  stroke={s.SHOT_MADE_FLAG === 1 ? '#22c55e' : '#ef4444'}
                  strokeWidth={0.5}
                />
              ))}
            </svg>
          </div>
          <div className='flex gap-4 mt-4 justify-center text-xs text-slate-400'>
            <span className='flex items-center gap-1.5'>
              <span className='w-2.5 h-2.5 rounded-full bg-green-400 inline-block'></span>{' '}
              Made
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='w-2.5 h-2.5 rounded-full bg-red-400 inline-block'></span>{' '}
              Missed
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default function PlayerPage() {
  const { id } = useParams()

  const playerId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) ? n : null
  }, [id])

  const [summary, setSummary] = useState<FantasySummary | null>(null)
  const [games, setGames] = useState<GameRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [gameSort, setGameSort] = useState<{ key: keyof GameRow; dir: 'desc' | 'asc' }>({
    key: 'date',
    dir: 'desc',
  })

  // Compare state
  const [compareName, setCompareName] = useState<string | null>(null)
  const [compareSummary, setCompareSummary] = useState<FantasySummary | null>(null)
  const [showCompareSearch, setShowCompareSearch] = useState(false)
  const [compareQuery, setCompareQuery] = useState('')
  const [compareResults, setCompareResults] = useState<any[]>([])

  const toggleGameSort = (key: keyof GameRow) => {
    setGameSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' }
    )
  }

  useEffect(() => {
    async function run() {
      if (!playerId) {
        setError('Invalid player id in URL.')
        return
      }

      setLoading(true)
      setError(null)
      setSummary(null)
      setGames([])

      try {
        const [summaryRes, gamelogRes, infoRes] = await Promise.all([
          fetch(`${API_BASE}/players/${playerId}/fantasy-summary?window=30&last_n=7`),
          fetch(`${API_BASE}/players/${playerId}/gamelog`),
          fetch(`${API_BASE}/players/${playerId}/info`),
        ])

        if (!summaryRes.ok) throw new Error(`Summary error: ${summaryRes.status}`)
        if (!gamelogRes.ok) throw new Error(`Game log error: ${gamelogRes.status}`)

        const summaryJson = await summaryRes.json()
        const gamelogJson = await gamelogRes.json()

        // Silently fall back if info endpoint fails
        let playerNameResult = `Player #${playerId}`
        try {
          if (infoRes.ok) {
            const infoJson = await infoRes.json()
            playerNameResult = infoJson.full_name ?? playerNameResult
          }
        } catch {
          // keep fallback
        }

        setPlayerName(playerNameResult)
        setSummary(summaryJson)
        setGames(gamelogJson.data ?? [])
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load player data')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [playerId])

  async function searchCompare(q: string) {
    if (!q.trim()) return
    try {
      const res = await fetch(
        `${API_BASE}/players/search?q=${encodeURIComponent(q)}&limit=10`
      )
      const data = await res.json()
      setCompareResults(data.data ?? [])
    } catch {
      setCompareResults([])
    }
  }

  async function loadCompare(pid: number, name: string) {
    setCompareName(name)
    setShowCompareSearch(false)
    setCompareQuery('')
    setCompareResults([])
    try {
      const summaryRes = await fetch(
        `${API_BASE}/players/${pid}/fantasy-summary?window=30&last_n=7`
      )
      const summaryJson = await summaryRes.json()
      setCompareSummary(summaryJson)
    } catch {
      setCompareSummary(null)
    }
  }

  const trendPositive = (summary?.trend_pct ?? 0) > 0
  const trendNeutral = (summary?.trend_pct ?? 0) === 0
  const trendLabel =
    summary?.trend_pct === undefined
      ? '—'
      : trendNeutral
        ? '—'
        : trendPositive
          ? `▲ ${summary.trend_pct}%`
          : `▼ ${Math.abs(summary.trend_pct)}%`

  const sortedGames = useMemo(() => {
    const arr = [...games]
    arr.sort((a, b) => {
      const av = (a as any)[gameSort.key] ?? ''
      const bv = (b as any)[gameSort.key] ?? ''
      if (av < bv) return gameSort.dir === 'desc' ? 1 : -1
      if (av > bv) return gameSort.dir === 'desc' ? -1 : 1
      return 0
    })
    return arr
  }, [games, gameSort])

  const displayedGames = showAll ? sortedGames : sortedGames.slice(0, 12)

  return (
    <div className='w-full max-w-5xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <Link
          className='text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors'
          to='/'
        >
          ← Back to search
        </Link>
        <Link
          className='text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors'
          to='/leaderboard'
        >
          Leaderboard →
        </Link>
      </div>

      {loading && (
        <div className='flex items-center justify-center py-20'>
          <div className='text-slate-400 text-lg animate-pulse'>
            Loading player data...
          </div>
        </div>
      )}

      {error && (
        <div className='bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4 text-red-400'>
          Error: {error}
        </div>
      )}

      {summary && (
        <>
          {/* Player Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-4 mb-2'>
              <div className='w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold'>
                {playerName?.charAt(0) ?? '#'}
              </div>
              <div>
                <h1 className='text-3xl font-bold text-white'>
                  {playerName ?? `Player #${summary.player_id}`}
                </h1>
                <p className='text-slate-400 text-sm'>
                  {summary.season} Season • {games.length} games played
                </p>
              </div>
            </div>
          </div>

          {/* Fantasy Summary Cards */}
          <h2 className='text-lg font-semibold text-slate-300 mb-3'>Fantasy Summary</h2>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8'>
            <StatCard label='Season FPPG' value={summary.fppg} accent='text-blue-400' />
            <StatCard label={`Last ${summary.last_n} FPPG`} value={summary.last_n_fppg} />
            <StatCard
              label='Trend'
              value={trendLabel}
              accent={
                trendNeutral
                  ? 'text-slate-400'
                  : trendPositive
                    ? 'text-green-400'
                    : 'text-red-400'
              }
            />
            <StatCard
              label='Volatility σ'
              value={summary.volatility_std}
              accent='text-slate-300'
            />
            <StatCard
              label='Floor (P20)'
              value={summary.floor_p20}
              accent='text-emerald-400'
            />
            <StatCard
              label='Ceiling (P80)'
              value={summary.ceiling_p80}
              accent='text-sky-400'
            />
          </div>

          {/* Compare Button */}
          <div className='flex items-center gap-3 mb-6'>
            <button
              className='px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-semibold transition-colors'
              onClick={() => setShowCompareSearch(true)}
              type='button'
            >
              ⚔️ Compare Player
            </button>
            {compareName && (
              <button
                className='text-slate-500 hover:text-red-400 text-sm transition-colors'
                onClick={() => {
                  setCompareName(null)
                  setCompareSummary(null)
                }}
                type='button'
              >
                ✕ Remove comparison
              </button>
            )}
          </div>

          {/* Compare Search Modal */}
          {showCompareSearch && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
              <div className='bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-white font-bold text-lg'>Compare with...</h3>
                  <button
                    className='text-slate-400 hover:text-white transition-colors'
                    onClick={() => {
                      setShowCompareSearch(false)
                      setCompareResults([])
                    }}
                    type='button'
                  >
                    ✕
                  </button>
                </div>
                <input
                  className='w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4'
                  placeholder='Search player...'
                  value={compareQuery}
                  autoFocus
                  onChange={(e) => {
                    setCompareQuery(e.target.value)
                    searchCompare(e.target.value)
                  }}
                />
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {compareResults.map((p) => (
                    <div
                      key={p.id}
                      className='flex items-center gap-3 p-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 cursor-pointer transition-colors'
                      onClick={() => loadCompare(p.id, p.full_name)}
                    >
                      <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold'>
                        {p.full_name.charAt(0)}
                      </div>
                      <div className='font-semibold text-white text-sm'>
                        {p.full_name}
                      </div>
                    </div>
                  ))}
                  {compareQuery && compareResults.length === 0 && (
                    <p className='text-slate-500 text-sm text-center py-4'>
                      No players found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scoring Settings */}
          <div className='bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 mb-8'>
            <p className='text-slate-500 text-xs uppercase tracking-wider mb-2'>
              Scoring Settings
            </p>
            <div className='flex flex-wrap gap-3 text-sm text-slate-300'>
              {Object.entries(summary.scoring).map(([k, v]) => (
                <span key={k} className='bg-slate-700/60 rounded-lg px-3 py-1'>
                  <span className='text-slate-400 uppercase text-xs'>{k}</span> {v}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Comparison Panel */}
      {compareSummary && summary && (
        <div className='bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8'>
          <h2 className='text-lg font-semibold text-white mb-6'>
            ⚔️ {playerName} vs {compareName}
          </h2>
          <div className='grid grid-cols-3 items-center gap-4 mb-4'>
            <div className='text-right text-white font-bold'>{playerName}</div>
            <div></div>
            <div className='text-left text-white font-bold'>{compareName}</div>
          </div>
          <div className='space-y-3'>
            {[
              {
                label: 'Season FPPG',
                a: summary.fppg,
                b: compareSummary.fppg,
                higher: true,
              },
              {
                label: `Last ${summary.last_n} FPPG`,
                a: summary.last_n_fppg,
                b: compareSummary.last_n_fppg,
                higher: true,
              },
              {
                label: 'Trend %',
                a: summary.trend_pct,
                b: compareSummary.trend_pct,
                higher: true,
              },
              {
                label: 'Floor (P20)',
                a: summary.floor_p20,
                b: compareSummary.floor_p20,
                higher: true,
              },
              {
                label: 'Ceiling (P80)',
                a: summary.ceiling_p80,
                b: compareSummary.ceiling_p80,
                higher: true,
              },
              {
                label: 'Volatility',
                a: summary.volatility_std,
                b: compareSummary.volatility_std,
                higher: false,
              },
            ].map(({ label, a, b, higher }) => {
              const aWins = higher ? a > b : a < b
              const bWins = higher ? b > a : b < a
              return (
                <div key={label} className='grid grid-cols-3 items-center gap-4'>
                  <div
                    className={`text-right font-mono font-bold text-lg ${aWins ? 'text-green-400' : bWins ? 'text-slate-400' : 'text-white'}`}
                  >
                    {a}
                  </div>
                  <div className='text-center text-slate-500 text-xs uppercase tracking-wider'>
                    {label}
                  </div>
                  <div
                    className={`text-left font-mono font-bold text-lg ${bWins ? 'text-green-400' : aWins ? 'text-slate-400' : 'text-white'}`}
                  >
                    {b}
                  </div>
                </div>
              )
            })}
          </div>
          {(() => {
            const cats = [
              { a: summary.fppg, b: compareSummary.fppg, higher: true },
              { a: summary.last_n_fppg, b: compareSummary.last_n_fppg, higher: true },
              { a: summary.trend_pct, b: compareSummary.trend_pct, higher: true },
              { a: summary.floor_p20, b: compareSummary.floor_p20, higher: true },
              { a: summary.ceiling_p80, b: compareSummary.ceiling_p80, higher: true },
              {
                a: summary.volatility_std,
                b: compareSummary.volatility_std,
                higher: false,
              },
            ]
            const aWins = cats.filter(({ a, b, higher }) =>
              higher ? a > b : a < b
            ).length
            const bWins = cats.filter(({ a, b, higher }) =>
              higher ? b > a : b < a
            ).length
            const winner = aWins > bWins ? playerName : bWins > aWins ? compareName : null
            return (
              <div className='mt-6 pt-4 border-t border-slate-700 text-center'>
                {winner ? (
                  <p className='text-green-400 font-bold text-lg'>
                    🏆 {winner} wins ({aWins > bWins ? aWins : bWins}/{cats.length}{' '}
                    categories)
                  </p>
                ) : (
                  <p className='text-slate-400 font-semibold'>
                    Tie ({aWins}/{cats.length} categories each)
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {!loading && games.length > 0 && <PerformanceChart games={games} />}
      {!loading && playerId && <ShotChart playerId={playerId} />}

      {/* Game Log */}
      {!loading && games.length > 0 && (
        <>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-slate-300'>
              Game Log{' '}
              <span className='text-slate-500 text-sm font-normal'>
                ({games.length} games)
              </span>
            </h2>
            {games.length > 12 && (
              <button
                className='text-blue-400 hover:text-blue-300 text-sm transition-colors'
                onClick={() => setShowAll((v) => !v)}
                type='button'
              >
                {showAll ? 'Show less ↑' : `Show all ${games.length} games ↓`}
              </button>
            )}
          </div>
          <div className='rounded-2xl border border-slate-700/60 overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-slate-800 text-slate-400 text-xs uppercase tracking-wider'>
                  {(
                    [
                      { key: 'date', label: 'Date', align: 'left' },
                      { key: 'matchup', label: 'Matchup', align: 'left' },
                      { key: 'wl', label: 'W/L', align: 'center' },
                      { key: 'pts', label: 'PTS', align: 'right' },
                      { key: 'reb', label: 'REB', align: 'right' },
                      { key: 'ast', label: 'AST', align: 'right' },
                      { key: 'stl', label: 'STL', align: 'right' },
                      { key: 'blk', label: 'BLK', align: 'right' },
                      { key: 'ftm', label: 'FT', align: 'right' },
                      { key: 'fg3m', label: '3PM', align: 'right' },
                      { key: 'fantasy_points', label: 'FP', align: 'right' },
                    ] as { key: keyof GameRow; label: string; align: string }[]
                  ).map(({ key, label, align }) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-${align} cursor-pointer select-none transition-colors ${gameSort.key === key ? 'text-blue-400' : 'hover:text-white'}`}
                      onClick={() => toggleGameSort(key)}
                    >
                      {label}
                      {gameSort.key === key ? (
                        <span className='ml-1'>
                          {gameSort.dir === 'desc' ? '↓' : '↑'}
                        </span>
                      ) : (
                        <span className='ml-1 text-slate-600'>↕</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedGames.map((g, idx) => (
                  <tr
                    key={idx}
                    className={`border-t border-slate-700/40 transition-colors ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/20'} ${g.wl === 'W' ? 'hover:bg-green-900/10' : 'hover:bg-red-900/10'}`}
                  >
                    <td className='px-4 py-3 text-slate-400 text-xs'>{g.date ?? '—'}</td>
                    <td className='px-4 py-3 font-medium text-white'>
                      {g.matchup ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.wl === 'W' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}
                      >
                        {g.wl ?? '—'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.pts ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.reb ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.ast ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.stl ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.blk ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.ftm ?? '—'}/{g.fta ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-slate-200'>
                      {g.fg3m ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono font-semibold text-blue-400'>
                      {g.fantasy_points ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !error && games.length === 0 && (
        <div className='text-center py-12 text-slate-400'>
          No games found for this player.
        </div>
      )}
    </div>
  )
}
