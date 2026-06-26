import { useEffect, useState, useMemo } from 'react'
import { useConnection } from '../hooks/useConnection'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
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

export default function Dashboard() {
  const { supabase, network } = useConnection()
  const [empCount, setEmpCount] = useState<number | null>(null)
  const [empLoading, setEmpLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedTehsil, setSelectedTehsil] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedCadre, setSelectedCadre] = useState<string>('')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('')

  useEffect(() => {
    const fetchCount = async () => {
      setEmpLoading(true)
      if (!isSupabaseConfigured) {
        setEmpCount(0)
        setEmpLoading(false)
        return
      }
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/employee?select=id`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
              Prefer: 'count=exact',
            },
          }
        )
        if (!res.ok) {
          setEmpCount(0)
        } else {
          const contentRange = res.headers.get('content-range')
          const count = contentRange
            ? parseInt(contentRange.split('/')[1])
            : 0
          setEmpCount(count)
        }
      } catch {
        setEmpCount(0)
      } finally {
        setEmpLoading(false)
      }
    }
    fetchCount()
  }, [])

  useEffect(() => {
    const fetchEmployees = async () => {
      setDataLoading(true)
      if (!isSupabaseConfigured) {
        setDataLoading(false)
        return
      }
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/employee?select=*`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
            },
          }
        )
        if (!res.ok) {
          const text = await res.text()
          console.error('Failed to load employees:', text)
        } else {
          const data = (await res.json()) as Employee[]
          setEmployees(data)
        }
      } catch (err) {
        console.error('Failed to load employees:', err)
      } finally {
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
    () => Array.from(new Set(employees.map((e) => e.tehsil))).sort(),
    [employees]
  )
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.parent_department))).sort(),
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
            )
          ).sort()
        : departments,
    [employees, selectedTehsil, departments]
  )
  const availableCadres = useMemo(
    () => {
      const base = selectedDept
        ? employees.filter(
            (e) =>
              (!selectedTehsil || e.tehsil === selectedTehsil) &&
              e.parent_department === selectedDept
          )
        : selectedTehsil
          ? employees.filter((e) => e.tehsil === selectedTehsil)
          : employees
      return Array.from(new Set(base.map((e) => e.cadre))).sort()
    },
    [employees, selectedTehsil, selectedDept]
  )
  const availableDesignations = useMemo(
    () => {
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
      return Array.from(new Set(base.map((e) => e.designation))).sort()
    },
    [employees, selectedTehsil, selectedDept, selectedCadre, availableCadres]
  )

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

  return (
    <div className="glass">
      <div className="dash-status-bar">
        <div className="dash-status-item">
          <span className={`dash-dot ${supabase === 'online' ? 'online' : supabase === 'offline' ? 'offline' : 'unconfigured'}`} />
          <span className="dash-status-label">Database</span>
        </div>
        <div className="dash-status-item">
          <span className={`dash-dot ${network === 'online' ? 'online' : network === 'offline' ? 'offline' : 'unconfigured'}`} />
          <span className="dash-status-label">Network</span>
        </div>
      </div>
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
            <h2 className="dash-title">Transfer-Posting Management System</h2>
            <p className="dash-subtitle">LG&CD Department, Jhang</p>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card highlight">
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
            <div className="dash-value">{empLoading ? '...' : empCount ?? '—'}</div>
            <div className="dash-meta">Registered staff</div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="dash-card-content">
            <div className="dash-label">Retiring in {CURRENT_YEAR}</div>
            <div className="dash-value">{dataLoading ? '...' : retirementThisYear}</div>
            <div className="dash-meta">Due for superannuation</div>
          </div>
        </div>
      </div>

      <div className="explorer-section">
        <div className="explorer-header">
          <div className="explorer-header-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="explorer-title">Hierarchical Explorer</h3>
        </div>
        <div className="explorer-summary">
          <span className="explorer-count">{filteredEmployees.length} employee(s)</span>
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

        {(selectedTehsil || selectedDept || selectedCadre || selectedDesignation) && (
          <div className="explorer-chips">
            {selectedTehsil && (
              <span
                className="explorer-chip"
                onClick={() => {
                  setSelectedTehsil('')
                  resetLowerLevels(1)
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Tehsil: {selectedTehsil}
              </span>
            )}
            {selectedDept && (
              <span
                className="explorer-chip"
                onClick={() => {
                  setSelectedDept('')
                  resetLowerLevels(2)
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Dept: {selectedDept}
              </span>
            )}
            {selectedCadre && (
              <span
                className="explorer-chip"
                onClick={() => {
                  setSelectedCadre('')
                  resetLowerLevels(3)
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cadre: {selectedCadre}
              </span>
            )}
            {selectedDesignation && (
              <span
                className="explorer-chip"
                onClick={() => {
                  setSelectedDesignation('')
                  resetLowerLevels(4)
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Designation: {selectedDesignation}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
