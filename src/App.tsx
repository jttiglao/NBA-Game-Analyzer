import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PlayerSearch from './pages/PlayerSearch'
import PlayerPage from './pages/PlayerPage'
import Leaderboard from './pages/Leaderboard'
import Home from './pages/Home'

function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <main className='min-h-screen bg-slate-900 text-slate-100'>
      <div className='w-full px-6 py-6'>
        <div className='flex items-center justify-between mb-8'>
          <Link
            to='/'
            className='text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity'
          >
            🏀 <span className='text-blue-400'>NBA</span> Game Analyzer
          </Link>
          <nav className='flex gap-4 text-sm'>
            <Link
              className={`transition-colors ${location.pathname === '/search' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              to='/search'
            >
              Search
            </Link>
            <Link
              className={`transition-colors ${location.pathname === '/leaderboard' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              to='/leaderboard'
            >
              Leaderboard
            </Link>
          </nav>
        </div>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/search' element={<PlayerSearch />} />
          <Route path='/leaderboard' element={<Leaderboard />} />
          <Route path='/player/:id' element={<PlayerPage />} />
        </Routes>
      </div>
    </main>
  )
}

export default App
