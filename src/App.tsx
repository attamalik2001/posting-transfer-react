import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Data from './pages/Data'
import UcWise from './pages/UcWise'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { usePWAInstall } from './hooks/usePWAInstall'
import './App.css'

type Page = 'dashboard' | 'employee' | 'ucwise' | 'profile' | 'settings'

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [retiringFilter, setRetiringFilter] = useState<'year' | null>(null)
  const { isInstallable, promptInstall } = usePWAInstall()

  const handleViewProfile = (id: number) => {
    setSelectedEmployeeId(id)
    setPage('profile')
  }

  const handleBackFromProfile = () => {
    setSelectedEmployeeId(null)
    setRetiringFilter(null)
    setPage('employee')
  }

  return (
    <div className="app">
      <main className={`content${page === 'profile' || page === 'ucwise' ? ' content-full' : ''}`}>
        {page === 'dashboard' && <Dashboard onNavigateToEmployee={() => { setRetiringFilter(null); setPage('employee') }} onNavigateToRetiring={() => { setRetiringFilter('year'); setPage('employee') }} />}
        {page === 'employee' && <Data onViewProfile={handleViewProfile} retiringFilter={retiringFilter} />}
        {page === 'ucwise' && <UcWise />}
        {page === 'profile' && (
          <Profile employeeId={selectedEmployeeId} onBack={handleBackFromProfile} />
        )}
        {page === 'settings' && <Settings />}
      </main>

      {isInstallable && (
        <button className="pwa-install-btn" onClick={promptInstall}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install App
        </button>
      )}

      <nav className="nav">
{([
           ['dashboard', 'Home'],
           ['employee', 'Employee'],
           ['ucwise', 'UC-wise'],
           ['settings', 'Settings'],
         ] as const).map(([id, label]) => (
           <button
             key={id}
             className={`nav-item ${page === id ? 'active' : ''}`}
             onClick={() => { if (id === 'employee') setRetiringFilter(null); setPage(id) }}
           >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {id === 'dashboard' && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
              {id === 'employee' && <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>}
              {id === 'ucwise' && <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>}
              {id === 'settings' && <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83 2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>}
            </svg>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
