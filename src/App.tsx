import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Data from './pages/Data'
import UcWise from './pages/UcWise'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { usePWAInstall } from './hooks/usePWAInstall'
import './App.css'

type Page = 'dashboard' | 'employee' | 'ucwise' | 'profile' | 'settings'
export type ThemeMode = 'light' | 'dark'

function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [retiringFilter, setRetiringFilter] = useState<'this_year' | 'next_year' | null>(null)
  const [initialPostingFilter, setInitialPostingFilter] = useState<'all' | 'posted' | 'not_posted'>('all')
  const { isInstallable, promptInstall } = usePWAInstall()

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tpms_theme')
      if (saved === 'light' || saved === 'dark') return saved
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('tpms_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

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
      <header className="top-bar">
        <button
          type="button"
          className="brand-wordmark"
          onClick={() => setPage('dashboard')}
        >
          LG&amp;CD Jhang
        </button>

        <nav className="top-nav" aria-label="Primary Navigation">
          {([
            ['dashboard', 'Overview'],
            ['employee', 'Employees'],
            ['ucwise', 'UC Postings'],
            ['settings', 'Settings'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`top-nav-link ${page === id || (id === 'employee' && page === 'profile') ? 'active' : ''}`}
              onClick={() => {
                if (id === 'employee') {
                  setRetiringFilter(null)
                  setInitialPostingFilter('all')
                }
                setPage(id)
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className={`content${page === 'profile' || page === 'ucwise' ? ' content-full' : ''}`}>
        {page === 'dashboard' && (
          <Dashboard
            onNavigateToEmployee={(filter = 'all') => {
              setRetiringFilter(null)
              setInitialPostingFilter(filter)
              setPage('employee')
            }}
            onNavigateToRetiring={(period) => {
              setRetiringFilter(period)
              setInitialPostingFilter('all')
              setPage('employee')
            }}
            onNavigateToUcWise={() => {
              setPage('ucwise')
            }}
            onViewProfile={handleViewProfile}
          />
        )}
        {page === 'employee' && (
          <Data
            key={`${initialPostingFilter}-${retiringFilter ?? 'none'}`}
            onViewProfile={handleViewProfile}
            retiringFilter={retiringFilter}
            initialPostingFilter={initialPostingFilter}
          />
        )}
        {page === 'ucwise' && <UcWise onViewProfile={handleViewProfile} />}
        {page === 'profile' && (
          <Profile employeeId={selectedEmployeeId} onBack={handleBackFromProfile} />
        )}
        {page === 'settings' && <Settings theme={theme} onThemeChange={setTheme} />}
      </main>

      {isInstallable && (
        <button className="pwa-install-btn" onClick={promptInstall}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install App
        </button>
      )}

      <nav className="nav" aria-label="Mobile Navigation">
        {([
          ['dashboard', 'Home'],
          ['employee', 'Employees'],
          ['ucwise', 'UC-wise'],
          ['settings', 'Settings'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`nav-item ${page === id || (id === 'employee' && page === 'profile') ? 'active' : ''}`}
            onClick={() => {
              if (id === 'employee') setRetiringFilter(null)
              setPage(id)
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {id === 'dashboard' && (
                <>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </>
              )}
              {id === 'employee' && (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              )}
              {id === 'ucwise' && (
                <>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </>
              )}
              {id === 'settings' && (
                <>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83 2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </>
              )}
            </svg>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
