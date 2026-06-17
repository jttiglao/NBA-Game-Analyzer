import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '🔍',
    title: 'Player Search',
    description:
      'Search any active NBA player and get a full breakdown of their season — game log, fantasy points, trends, and more.',
    action: 'Search Players',
    route: '/search',
    accent: 'border-blue-500/40 hover:border-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    icon: '🏆',
    title: 'Leaderboard',
    description:
      'Rank all 500+ active NBA players by fantasy points, points, rebounds, assists, floor, ceiling, and volatility.',
    action: 'View Leaderboard',
    route: '/leaderboard',
    accent: 'border-emerald-500/40 hover:border-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500',
  },
]

const stats = [
  { value: '500+', label: 'Active Players' },
  { value: '82', label: 'Games Tracked' },
  { value: '11', label: 'Stats Per Game' },
  { value: 'Live', label: 'NBA Data' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className='w-full'>
      {/* Hero */}
      <div className='text-center py-16 px-4'>
        <div className='inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6'>
          🏀 2025-26 NBA Season
        </div>
        <h1 className='text-5xl md:text-6xl font-bold text-white mb-6 leading-tight'>
          NBA Analytics
          <span className='block text-blue-400'>Command Center</span>
        </h1>
        <p className='text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10'>
          Deep fantasy basketball analytics for every active NBA player. Track
          performance, spot trends, and dominate your league.
        </p>
        <div className='flex flex-wrap gap-4 justify-center'>
          <button
            onClick={() => navigate('/search')}
            className='px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-base'
          >
            Search a Player →
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className='px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 hover:border-slate-500 transition-colors text-base'
          >
            View Leaderboard
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 px-4'>
        {stats.map((s) => (
          <div
            key={s.label}
            className='bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center'
          >
            <div className='text-3xl font-bold text-white mb-1'>{s.value}</div>
            <div className='text-slate-400 text-sm'>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className='grid md:grid-cols-2 gap-6 mb-16 px-4'>
        {features.map((f) => (
          <div
            key={f.title}
            className={`bg-slate-800/60 border rounded-2xl p-8 flex flex-col gap-4 transition-all cursor-pointer ${
              f.route === '/search'
                ? 'border-blue-500/40 hover:border-blue-400'
                : 'border-emerald-500/40 hover:border-emerald-400'
            }`}
            onClick={() => navigate(f.route)}
          >
            <div className='text-4xl'>{f.icon}</div>
            <div>
              <h3 className='text-xl font-bold text-white mb-2'>{f.title}</h3>
              <p className='text-slate-400 leading-relaxed'>{f.description}</p>
            </div>
            <button
              className={`mt-auto self-start px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${
                f.route === '/search'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              type='button'
            >
              {f.action} →
            </button>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className='px-4 mb-16'>
        <h2 className='text-2xl font-bold text-white mb-8 text-center'>How It Works</h2>
        <div className='grid md:grid-cols-3 gap-6'>
          {[
            {
              step: '01',
              title: 'Live Data Pipeline',
              description:
                'A Python ETL pipeline pulls stats from the official NBA API daily and stores them in a Supabase database.',
              icon: '🔄',
            },
            {
              step: '02',
              title: 'Fantasy Scoring Engine',
              description:
                'Every game is scored using a configurable fantasy points formula — tracking FPPG, trends, floor, ceiling, and volatility.',
              icon: '⚙️',
            },
            {
              step: '03',
              title: 'Instant Analytics',
              description:
                'All data is cached and served instantly. Search any player or sort the full leaderboard with zero load time.',
              icon: '⚡',
            },
          ].map((item) => (
            <div
              key={item.step}
              className='bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6'
            >
              <div className='flex items-center gap-3 mb-4'>
                <span className='text-2xl'>{item.icon}</span>
                <span className='text-slate-600 font-mono text-sm'>{item.step}</span>
              </div>
              <h3 className='text-white font-semibold mb-2'>{item.title}</h3>
              <p className='text-slate-400 text-sm leading-relaxed'>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className='px-4 mb-16 text-center'>
        <p className='text-slate-500 text-xs uppercase tracking-wider mb-4'>Built With</p>
        <div className='flex flex-wrap justify-center gap-3'>
          {[
            'Python',
            'FastAPI',
            'nba_api',
            'Supabase',
            'React',
            'TypeScript',
            'Tailwind CSS',
          ].map((tech) => (
            <span
              key={tech}
              className='bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 text-sm'
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
