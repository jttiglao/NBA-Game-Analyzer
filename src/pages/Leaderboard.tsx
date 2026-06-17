import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const API_BASE = import.meta.env.VITE_NBA_SERVICE_URL ?? 'http://127.0.0.1:8001'

type Row = {
  id: number
  full_name: string
  is_active: boolean
  fppg: number
  fppg_7: number
  trend_pct: number
  avg_pts: number
  avg_reb: number
  avg_ast: number
  volatility_std: number
  floor_p20: number
  ceiling_p80: number
  games_count: number
}

type SortKey =
  | 'fppg'
  | 'fppg_7'
  | 'trend_pct'
  | 'avg_pts'
  | 'avg_reb'
  | 'avg_ast'
  | 'volatility_std'
  | 'floor_p20'
  | 'ceiling_p80'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'fppg', label: 'FPPG' },
  { value: 'fppg_7', label: 'Last N FPPG' },
  { value: 'trend_pct', label: 'Trend %' },
  { value: 'avg_pts', label: 'Points' },
  { value: 'avg_reb', label: 'Rebounds' },
  { value: 'avg_ast', label: 'Assists' },
  { value: 'floor_p20', label: 'Floor' },
  { value: 'ceiling_p80', label: 'Ceiling' },
  { value: 'volatility_std', label: 'Volatility' },
]

const Select = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: any
  onChange: (v: any) => void
  children: React.ReactNode
}) => (
  <div className='flex flex-col gap-1'>
    <span className='text-slate-500 text-xs uppercase tracking-wider'>{label}</span>
    <select
      className='bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-slate-400 transition-colors'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  </div>
)

export default function Leaderboard() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(25)
  const [lastN, setLastN] = useState(7)
  const [sortKey, setSortKey] = useState<SortKey>('fppg')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      setRows([])
      try {
        const res = await fetch(
          `${API_BASE}/players/leaderboard?limit=${limit}&last_n=${lastN}`
        )
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        setRows(data.data ?? [])
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [limit, lastN])

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const av = (a as any)[sortKey] ?? 0
      const bv = (b as any)[sortKey] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return arr
  }, [rows, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className='text-slate-600 ml-1'>↕</span>
    return <span className='text-blue-400 ml-1'>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const ColHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className={`px-4 py-3 text-right cursor-pointer transition-colors select-none ${
        sortKey === col ? 'text-blue-400' : 'text-slate-400 hover:text-white'
      }`}
      onClick={() => toggleSort(col)}
    >
      {label} <SortIcon col={col} />
    </th>
  )

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Leaderboard</h1>
          <p className='text-slate-400 text-sm mt-1'>
            Full season stats for all active NBA players
          </p>
        </div>
        <Link
          className='text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors'
          to='/'
        >
          ← Back to search
        </Link>
      </div>

      {/* Controls */}
      <div className='flex flex-wrap gap-6 items-end mb-6 bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/60'>
        <Select label='Players' value={limit} onChange={(v) => setLimit(Number(v))}>
          <option value={10}>Top 10</option>
          <option value={25}>Top 25</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
          <option value={516}>All Players</option>
        </Select>

        <Select label='Last N Games' value={lastN} onChange={(v) => setLastN(Number(v))}>
          <option value={5}>5 games</option>
          <option value={7}>7 games</option>
          <option value={10}>10 games</option>
          <option value={15}>15 games</option>
        </Select>

        <Select
          label='Sort By'
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <div className='flex flex-col gap-1'>
          <span className='text-slate-500 text-xs uppercase tracking-wider'>Order</span>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              sortDir === 'desc'
                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                : 'bg-slate-900 border-slate-600 text-white hover:border-slate-400'
            }`}
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            type='button'
          >
            {sortDir === 'desc' ? '↓ Highest First' : '↑ Lowest First'}
          </button>
        </div>

        {!loading && rows.length > 0 && (
          <div className='ml-auto flex flex-col gap-1 text-right'>
            <span className='text-slate-500 text-xs uppercase tracking-wider'>
              Showing
            </span>
            <span className='text-white font-semibold'>{sorted.length} players</span>
          </div>
        )}
      </div>

      {/* States */}
      {error && (
        <div className='bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4 text-red-400'>
          Error: {error}
        </div>
      )}
      {loading && (
        <div className='flex items-center justify-center py-20'>
          <div className='text-slate-400 text-lg animate-pulse'>
            Loading leaderboard...
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && sorted.length > 0 && (
        <div className='w-full overflow-x-auto rounded-2xl border border-slate-700/60'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-slate-800 text-xs uppercase tracking-wider border-b border-slate-700'>
                <th className='px-4 py-3 text-left text-slate-400 w-12'>#</th>
                <th className='px-4 py-3 text-left text-slate-400'>Player</th>
                <th className='px-4 py-3 text-right text-slate-400'>GP</th>
                <ColHeader col='fppg' label='FPPG' />
                <ColHeader col='fppg_7' label={`Last ${lastN}`} />
                <ColHeader col='trend_pct' label='Trend' />
                <ColHeader col='avg_pts' label='PTS' />
                <ColHeader col='avg_reb' label='REB' />
                <ColHeader col='avg_ast' label='AST' />
                <ColHeader col='floor_p20' label='Floor' />
                <ColHeader col='ceiling_p80' label='Ceiling' />
                <ColHeader col='volatility_std' label='Vol' />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-t border-slate-700/40 hover:bg-blue-900/10 cursor-pointer transition-colors ${
                    i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/20'
                  }`}
                  onClick={() => navigate(`/player/${p.id}`)}
                >
                  <td className='px-4 py-3 font-mono text-xs font-bold'>
                    {i === 0 ? (
                      <span className='text-yellow-400'>🥇</span>
                    ) : i === 1 ? (
                      <span className='text-slate-300'>🥈</span>
                    ) : i === 2 ? (
                      <span className='text-amber-600'>🥉</span>
                    ) : (
                      <span className='text-slate-500'>{i + 1}</span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='font-semibold text-white'>{p.full_name}</div>
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-400 text-xs'>
                    {p.games_count ?? '—'}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-white font-semibold'>
                    {p.fppg}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-200'>
                    {p.fppg_7}
                  </td>
                  <td className='px-4 py-3 text-right font-mono'>
                    {p.trend_pct > 0 ? (
                      <span className='text-green-400'>▲ {p.trend_pct}%</span>
                    ) : p.trend_pct < 0 ? (
                      <span className='text-red-400'>▼ {Math.abs(p.trend_pct)}%</span>
                    ) : (
                      <span className='text-slate-400'>—</span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-200'>
                    {p.avg_pts}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-200'>
                    {p.avg_reb}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-200'>
                    {p.avg_ast}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-emerald-400'>
                    {p.floor_p20}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-sky-400'>
                    {p.ceiling_p80}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-slate-400'>
                    {p.volatility_std}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className='text-center py-20 text-slate-400'>No leaderboard results.</div>
      )}
    </div>
  )
}
