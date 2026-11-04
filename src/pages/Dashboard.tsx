import { useEffect, useState, useMemo } from 'react'
import { useConnection } from '../hooks/useConnection'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  supabaseFetch,
} from '../lib/supabase'
import './Dashboard.css'

interface Employee {
  id: number
  employee_name: string
  father_name: string
  cnic: string
  address: string
  contact: string
  email: string
  date_of_birth: string
  designation: string
  parent_department: string
  cadre: string
  employment_status: string
  service_status: string
  posting_status: string
  posting_type: string
  date_of_appointment: string
  date_of_regularization: string | null
  date_of_superannuation: string
  tehsil: string
  uc: string
}

const CURRENT_YEAR = new Date().getFullYear()

function isEmployeePosted(emp: Employee): boolean {
  const status = (emp.posting_status || '').trim().toLowerCase()
  if (status === 'not posted' || status === 'unposted') return false
  const uc = (emp.uc || '').trim()
  if (!uc || uc.toLowerCase() === 'unassigned' || uc.toLowerCase() === '(unassigned)') {
    return false
  }
  return true
}

interface Props {
  onNavigateToEmployee: (filter?: 'all' | 'posted' | 'not_posted') => void
  onNavigateToRetiring: (period: 'this_year' | 'next_year') => void
  onNavigateToUcWise?: () => void
  onViewProfile?: (id: number) => void
}

export default function Dashboard({
  onNavigateToEmployee,
  onNavigateToRetiring,
  onNavigateToUcWise,
  onViewProfile,
}: Props) {
  const { supabase, network } = useConnection()
  const [empCount, setEmpCount] = useState<number | null>(null)
  const [ucTotalCount, setUcTotalCount] = useState<number | null>(null)
  const [empLoading, setEmpLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedTehsil, setSelectedTehsil] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedCadre, setSelectedCadre] = useState<string>('')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('')

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmpLoading(true)
      setDataLoading(true)
      if (!isSupabaseConfigured) {
        setEmpCount(0)
        setUcTotalCount(0)
        setEmpLoading(false)
        setDataLoading(false)
        return
      }
      try {
        const [res, ucRes] = await Promise.all([
          supabaseFetch(`${supabaseUrl}/rest/v1/employee?select=*`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
              Prefer: 'count=exact',
            },
          }),
          supabaseFetch(`${supabaseUrl}/rest/v1/uc?select=id`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
              Prefer: 'count=exact',
            },
          }),
        ])

        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to load employees:', text)
          setEmpCount(0)
        } else {
          const contentRange = res.headers.get('content-range')
          const rangeTotal = contentRange
            ? parseInt(contentRange.split('/')[1], 10)
            : NaN
          const data = (await res.json()) as Employee[]
          setEmployees(data)
          setEmpCount(!Number.isNaN(rangeTotal) && rangeTotal > 0 ? rangeTotal : data.length)
        }

        if (ucRes.ok) {
          const ucData = (await ucRes.json()) as { id: number }[]
          setUcTotalCount(ucData.length)
        }
      } catch (err) {
        console.error('Failed to load employees:', err)
        setEmpCount(0)
      } finally {
        setEmpLoading(false)
        setDataLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const retirementThisYear = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.date_of_superannuation) return false
      const year = new Date(emp.date_of_superannuation).getFullYear()
      return year === CURRENT_YEAR
    }).length
  }, [employees])

  const retirementNextYear = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.date_of_superannuation) return false
      const year = new Date(emp.date_of_superannuation).getFullYear()
      return year === CURRENT_YEAR + 1
    }).length
  }, [employees])

  const postedCount = useMemo(() => {
    return employees.filter(isEmployeePosted).length
  }, [employees])

  const notPostedCount = useMemo(() => {
    return employees.filter((emp) => !isEmployeePosted(emp)).length
  }, [employees])

  const uniqueUcsCount = useMemo(() => {
    return new Set(
      employees.filter(isEmployeePosted).map((e) => e.uc).filter(Boolean)
    ).size
  }, [employees])

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedTehsil && emp.tehsil !== selectedTehsil) return false
      if (selectedDept && emp.parent_department !== selectedDept) return false
      if (selectedCadre && emp.cadre !== selectedCadre) return false
      if (selectedDesignation && emp.designation !== selectedDesignation)
        return false
      return true
    })
  }, [employees, selectedTehsil, selectedDept, selectedCadre, selectedDesignation])

  const tehsils = useMemo(
    () => Array.from(new Set(employees.map((e) => e.tehsil).filter(Boolean))).sort(),
    [employees]
  )
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.parent_department).filter(Boolean))).sort(),
    [employees]
  )

  const availableDepts = useMemo(
    () =>
      selectedTehsil
        ? Array.from(
            new Set(
              employees
                .filter((e) => e.tehsil === selectedTehsil)
                .map((e) => e.parent_department)
                .filter(Boolean)
            )
          ).sort()
        : departments,
    [employees, selectedTehsil, departments]
  )

  const availableCadres = useMemo(() => {
    const base = selectedDept
      ? employees.filter(
          (e) =>
            (!selectedTehsil || e.tehsil === selectedTehsil) &&
            e.parent_department === selectedDept
        )
      : selectedTehsil
        ? employees.filter((e) => e.tehsil === selectedTehsil)
        : employees
    return Array.from(new Set(base.map((e) => e.cadre).filter(Boolean))).sort()
  }, [employees, selectedTehsil, selectedDept])

  const availableDesignations = useMemo(() => {
    const base = selectedCadre
      ? employees.filter(
          (e) =>
            (!selectedTehsil || e.tehsil === selectedTehsil) &&
            (!selectedDept || e.parent_department === selectedDept) &&
            e.cadre === selectedCadre
        )
      : availableCadres.length > 0 || selectedTehsil || selectedDept
        ? employees.filter(
            (e) =>
              (!selectedTehsil || e.tehsil === selectedTehsil) &&
              (!selectedDept || e.parent_department === selectedDept)
          )
        : employees
    return Array.from(new Set(base.map((e) => e.designation).filter(Boolean))).sort()
  }, [employees, selectedTehsil, selectedDept, selectedCadre, availableCadres])

  const resetLowerLevels = (level: number) => {
    if (level <= 1) {
      setSelectedDept('')
      setSelectedCadre('')
      setSelectedDesignation('')
    } else if (level <= 2) {
      setSelectedCadre('')
      setSelectedDesignation('')
    } else if (level <= 3) {
      setSelectedDesignation('')
    }
  }

  const hasFilters = Boolean(
    selectedTehsil || selectedDept || selectedCadre || selectedDesignation
  )

  return (
    <div className="glass">
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-header-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="dash-title">Transfer-Posting Management System</h1>
            <p className="dash-subtitle">
              Local Government &amp; Community Development Department · District Jhang
            </p>
          </div>
        </div>

        <div className="dash-status-bar">
          <div className="dash-status-item">
            <span className={`dash-dot ${supabase === 'online' ? 'online' : supabase === 'offline' ? 'offline' : 'unconfigured'}`} />
            <span className="dash-status-label">
              Database {supabase === 'online' ? 'Connected' : supabase === 'offline' ? 'Offline' : 'Standby'}
            </span>
          </div>
          <span className="dash-status-sep" aria-hidden="true">·</span>
          <div className="dash-status-item">
            <span className={`dash-dot ${network === 'online' ? 'online' : 'offline'}`} />
            <span className="dash-status-label">
              Network {network === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <button
          type="button"
          className="dash-card"
          onClick={() => onNavigateToUcWise?.()}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Total Union Councils</div>
            <div className="dash-value tabular-nums">
              {dataLoading ? '...' : ucTotalCount ?? uniqueUcsCount}
            </div>
            <div className="dash-meta">Across {tehsils.length || 4} Tehsils in Jhang</div>
          </div>
        </button>

        <button
          type="button"
          className="dash-card highlight"
          onClick={() => onNavigateToEmployee('all')}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Total Employees</div>
            <div className="dash-value tabular-nums">{empLoading ? '...' : empCount ?? '—'}</div>
            <div className="dash-meta">Registered department staff</div>
          </div>
        </button>

        <button
          type="button"
          className="dash-card dash-card-posted"
          onClick={() => onNavigateToEmployee('posted')}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Total Posted</div>
            <div className="dash-value tabular-nums">{dataLoading ? '...' : postedCount}</div>
            <div className="dash-meta">Assigned to Union Councils</div>
          </div>
        </button>

        <button
          type="button"
          className="dash-card dash-card-not-posted"
          onClick={() => onNavigateToEmployee('not_posted')}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Total Not Posted</div>
            <div className="dash-value tabular-nums">{dataLoading ? '...' : notPostedCount}</div>
            <div className="dash-meta">Unassigned / awaiting posting</div>
          </div>
        </button>

        <button
          type="button"
          className="dash-card"
          onClick={() => onNavigateToRetiring('this_year')}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Retiring This Year</div>
            <div className="dash-value tabular-nums">{dataLoading ? '...' : retirementThisYear}</div>
            <div className="dash-meta">Retiring in {CURRENT_YEAR}</div>
          </div>
        </button>

        <button
          type="button"
          className="dash-card"
          onClick={() => onNavigateToRetiring('next_year')}
        >
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Retiring Next Year</div>
            <div className="dash-value tabular-nums">{dataLoading ? '...' : retirementNextYear}</div>
            <div className="dash-meta">Retiring in {CURRENT_YEAR + 1}</div>
          </div>
        </button>
      </div>

      <div className="explorer-section">
        <div className="explorer-top-row">
          <div className="explorer-header">
            <div className="explorer-header-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h2 className="explorer-title">Hierarchical Staff Explorer</h2>
              <p className="explorer-subtitle">
                Filter personnel by Tehsil, Department, Cadre, and Designation
              </p>
            </div>
          </div>

          <div className="explorer-summary">
            <span className="explorer-count tabular-nums">
              Showing {filteredEmployees.length} of {employees.length} staff
            </span>
            {hasFilters && (
              <button
                type="button"
                className="explorer-reset-btn"
                onClick={() => {
                  setSelectedTehsil('')
                  resetLowerLevels(1)
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="explorer-filters">
          <div className="explorer-filter-group">
            <label className="explorer-label">Tehsil</label>
            <div className="explorer-select-wrap">
              <select
                className="explorer-select"
                value={selectedTehsil}
                onChange={(e) => {
                  setSelectedTehsil(e.target.value)
                  resetLowerLevels(1)
                }}
              >
                <option value="">All Tehsils</option>
                {tehsils.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <svg className="explorer-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="explorer-filter-group">
            <label className="explorer-label">Department</label>
            <div className="explorer-select-wrap">
              <select
                className="explorer-select"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value)
                  resetLowerLevels(2)
                }}
              >
                <option value="">All Departments</option>
                {availableDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <svg className="explorer-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="explorer-filter-group">
            <label className="explorer-label">Cadre</label>
            <div className="explorer-select-wrap">
              <select
                className="explorer-select"
                value={selectedCadre}
                onChange={(e) => {
                  setSelectedCadre(e.target.value)
                  resetLowerLevels(3)
                }}
              >
                <option value="">All Cadres</option>
                {availableCadres.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <svg className="explorer-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="explorer-filter-group">
            <label className="explorer-label">Designation</label>
            <div className="explorer-select-wrap">
              <select
                className="explorer-select"
                value={selectedDesignation}
                onChange={(e) => {
                  setSelectedDesignation(e.target.value)
                  resetLowerLevels(4)
                }}
              >
                <option value="">All Designations</option>
                {availableDesignations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <svg className="explorer-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="explorer-chips">
            {selectedTehsil && (
              <button
                type="button"
                className="explorer-chip"
                onClick={() => {
                  setSelectedTehsil('')
                  resetLowerLevels(1)
                }}
              >
                <span>Tehsil: {selectedTehsil}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {selectedDept && (
              <button
                type="button"
                className="explorer-chip"
                onClick={() => {
                  setSelectedDept('')
                  resetLowerLevels(2)
                }}
              >
                <span>Dept: {selectedDept}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {selectedCadre && (
              <button
                type="button"
                className="explorer-chip"
                onClick={() => {
                  setSelectedCadre('')
                  resetLowerLevels(3)
                }}
              >
                <span>Cadre: {selectedCadre}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {selectedDesignation && (
              <button
                type="button"
                className="explorer-chip"
                onClick={() => {
                  setSelectedDesignation('')
                  resetLowerLevels(4)
                }}
              >
                <span>Designation: {selectedDesignation}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="explorer-results">
          <div className="explorer-table-head">
            <span>Employee Name</span>
            <span>Designation &amp; Cadre</span>
            <span>Tehsil · Union Council</span>
            <span className="text-right">Superannuation</span>
          </div>
          <div className="explorer-table-body">
            {dataLoading ? (
              <div className="explorer-empty">Loading staff records...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="explorer-empty">No employees match the selected filters.</div>
            ) : (
              filteredEmployees.slice(0, 12).map((emp) => (
                <div
                  key={emp.id}
                  className="explorer-row"
                  onClick={() => onViewProfile ? onViewProfile(emp.id) : onNavigateToEmployee('all')}
                >
                  <div className="explorer-cell-primary">
                    <span className="explorer-emp-name">{emp.employee_name}</span>
                    <span className="explorer-emp-sub tabular-nums">{emp.cnic}</span>
                  </div>
                  <div className="explorer-cell-secondary">
                    <span>{emp.designation}</span>
                    <span className="explorer-emp-sub">
                      {emp.parent_department} {emp.cadre ? `· ${emp.cadre}` : ''}
                    </span>
                  </div>
                  <div className="explorer-cell-secondary">
                    <span>
                      {(emp.posting_status || '').trim().toLowerCase() === 'not posted' || !emp.uc
                        ? 'Not Posted'
                        : emp.uc}
                    </span>
                    <span className="explorer-emp-sub">{emp.tehsil || '—'}</span>
                  </div>
                  <div className="explorer-cell-date tabular-nums">
                    {emp.date_of_superannuation || '—'}
                  </div>
                </div>
              ))
            )}
          </div>
          {filteredEmployees.length > 12 && (
            <div className="explorer-footer">
              <button
                type="button"
                className="explorer-view-all-btn"
                onClick={() => onNavigateToEmployee('all')}
              >
                View all {filteredEmployees.length} employees in directory →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
