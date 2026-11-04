import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  supabaseFetch,
} from '../lib/supabase'
import './Data.css'

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

interface UC {
  id: number
  tehsil: string
  uc_name: string
}

type PostingFilter = 'all' | 'posted' | 'not_posted'

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
  onViewProfile: (id: number) => void
  retiringFilter?: 'this_year' | 'next_year' | null
  initialPostingFilter?: PostingFilter
}

export default function Data({
  onViewProfile,
  retiringFilter,
  initialPostingFilter = 'all',
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ucList, setUcList] = useState<UC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tehsilFilter, setTehsilFilter] = useState('')
  const [postingFilter, setPostingFilter] = useState<PostingFilter>(initialPostingFilter)
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedUcId, setSelectedUcId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      if (!isSupabaseConfigured) {
        setError('Supabase not configured')
        setLoading(false)
        return
      }

      try {
        const empRes = await supabaseFetch(
          `${supabaseUrl}/rest/v1/employee?select=*`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
            },
          }
        )

        if (!empRes.ok) {
          const text = await empRes.text()
          throw new Error(`HTTP ${empRes.status}: ${text}`)
        }

        const empData = (await empRes.json()) as Employee[]
        setEmployees(empData)

        const ucRes = await supabaseFetch(
          `${supabaseUrl}/rest/v1/uc?select=id,tehsil,uc_name`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              Accept: 'application/json',
            },
          }
        )

        if (!ucRes.ok) {
          const text = await ucRes.text()
          throw new Error(`HTTP ${ucRes.status}: ${text}`)
        }

        const ucData = (await ucRes.json()) as UC[]
        setUcList(ucData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const CURRENT_YEAR = new Date().getFullYear()

  const tehsils = Array.from(
    new Set([
      ...ucList.map((uc) => uc.tehsil),
      ...employees.map((e) => e.tehsil),
    ].filter(Boolean))
  ).sort()

  const postedCount = employees.filter(isEmployeePosted).length
  const unpostedEmployees = employees.filter((e) => !isEmployeePosted(e))
  const notPostedCount = unpostedEmployees.length

  const employeesSorted = [...employees].sort((a, b) => {
    const aPosted = isEmployeePosted(a)
    const bPosted = isEmployeePosted(b)
    // Show unposted / not-posted staff first so they are immediately visible
    if (aPosted !== bPosted) return aPosted ? 1 : -1
    return (a.uc || '').localeCompare(b.uc || '') || (a.employee_name || '').localeCompare(b.employee_name || '')
  })

  const filteredUcs =
    selectedTehsil && editingId !== null
      ? ucList.filter((uc) => uc.tehsil === selectedTehsil)
      : []

  const filteredEmployees = employeesSorted.filter((emp) => {
    const posted = isEmployeePosted(emp)
    if (postingFilter === 'posted' && !posted) return false
    if (postingFilter === 'not_posted' && posted) return false

    const term = searchTerm.toLowerCase()
    if (retiringFilter === 'this_year') {
      if (!emp.date_of_superannuation) return false
      const year = new Date(emp.date_of_superannuation).getFullYear()
      if (year !== CURRENT_YEAR) return false
    } else if (retiringFilter === 'next_year') {
      if (!emp.date_of_superannuation) return false
      const year = new Date(emp.date_of_superannuation).getFullYear()
      if (year !== CURRENT_YEAR + 1) return false
    }
    if (tehsilFilter && emp.tehsil !== tehsilFilter) return false
    if (!term) return true
    return (
      emp.employee_name?.toLowerCase().includes(term) ||
      emp.father_name?.toLowerCase().includes(term) ||
      emp.cnic?.toLowerCase().includes(term) ||
      emp.designation?.toLowerCase().includes(term) ||
      emp.uc?.toLowerCase().includes(term) ||
      emp.posting_status?.toLowerCase().includes(term)
    )
  })

  const getRetirementLabel = (dateStr: string) => {
    if (!dateStr) return { text: 'Active', tone: 'active' }
    const yr = new Date(dateStr).getFullYear()
    if (yr < CURRENT_YEAR) return { text: 'Retired', tone: 'danger' }
    if (yr === CURRENT_YEAR) return { text: `Retiring ${CURRENT_YEAR}`, tone: 'warning' }
    return { text: 'Active', tone: 'active' }
  }

  const handleViewProfile = (emp: Employee) => {
    onViewProfile(emp.id)
  }

  const openEdit = (emp: Employee) => {
    setExpandedId(emp.id)
    setEditingId(emp.id)
    if (emp.uc) {
      const match = ucList.find((uc) => uc.uc_name === emp.uc)
      if (match) {
        setSelectedTehsil(match.tehsil)
        setSelectedUcId(match.id)
        return
      }
    }
    if (emp.tehsil && tehsils.includes(emp.tehsil)) {
      setSelectedTehsil(emp.tehsil)
    } else if (tehsils.length > 0) {
      setSelectedTehsil(tehsils[0])
    } else {
      setSelectedTehsil('')
    }
    setSelectedUcId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const handleToggleNotPosted = async (emp: Employee) => {
    setSavingId(emp.id)
    try {
      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }

      const empPatchRes = await supabaseFetch(
        `${supabaseUrl}/rest/v1/employee?id=eq.${emp.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            posting_status: 'Not Posted',
            uc: '',
          }),
        }
      )

      if (!empPatchRes.ok) {
        const text = await empPatchRes.text()
        throw new Error(`Failed to update posting status: ${text}`)
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id ? { ...e, posting_status: 'Not Posted', uc: '' } : e
        )
      )
    } catch (err) {
      console.error('Failed to mark employee as Not Posted:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to update posting status'
      )
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (emp: Employee) => {
    setDeletingId(emp.id)

    try {
      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      }

      const delRes = await supabaseFetch(
        `${supabaseUrl}/rest/v1/employee?id=eq.${emp.id}`,
        {
          method: 'DELETE',
          headers: {
            ...headers,
            Prefer: 'return=minimal',
          },
        }
      )

      if (!delRes.ok) {
        const text = await delRes.text()
        throw new Error(`Failed to delete employee: ${text}`)
      }

      setEmployees((prev) => prev.filter((e) => e.id !== emp.id))
    } catch (err) {
      console.error('Failed to delete employee:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to delete employee'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = async (emp: Employee) => {
    if (!selectedTehsil || !selectedUcId) return

    setSavingId(emp.id)

    try {
      const selectedUc = ucList.find((uc) => uc.id === selectedUcId)
      if (!selectedUc) return

      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      }

      const postingCheckRes = await supabaseFetch(
        `${supabaseUrl}/rest/v1/posting?employee_id=eq.${emp.id}&select=id`,
        {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json',
          },
        }
      )

      const existingPostings: { id: number }[] = postingCheckRes.ok
        ? await postingCheckRes.json()
        : []

      if (existingPostings.length > 0) {
        const patchRes = await supabaseFetch(
          `${supabaseUrl}/rest/v1/posting?id=eq.${existingPostings[0].id}`,
          {
            method: 'PATCH',
            headers: {
              ...headers,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ uc_id: selectedUcId }),
          }
        )

        if (!patchRes.ok) {
          const text = await patchRes.text()
          throw new Error(`Failed to update posting: ${text}`)
        }
      } else {
        const postRes = await supabaseFetch(`${supabaseUrl}/rest/v1/posting`, {
          method: 'POST',
          headers: {
            ...headers,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ employee_id: emp.id, uc_id: selectedUcId }),
        })

        if (!postRes.ok) {
          const text = await postRes.text()
          throw new Error(`Failed to create posting: ${text}`)
        }
      }

      const empPatchRes = await supabaseFetch(
        `${supabaseUrl}/rest/v1/employee?id=eq.${emp.id}`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            tehsil: selectedUc.tehsil,
            uc: selectedUc.uc_name,
            posting_status: 'Posted',
          }),
        }
      )

      if (!empPatchRes.ok) {
        const text = await empPatchRes.text()
        throw new Error(`Failed to update employee: ${text}`)
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? {
                ...e,
                tehsil: selectedUc.tehsil,
                uc: selectedUc.uc_name,
                posting_status: 'Posted',
              }
            : e
        )
      )

      setEditingId(null)
    } catch (err) {
      console.error('Failed to update posting:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to update posting'
      )
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="glass data-container">
        <div className="loader" />
        <p className="loading-text">Loading employee directory...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass data-container">
        <div className="error-state">
          <p className="error-title">Unable to load data</p>
          <p className="error-message">{error}</p>
          <button
            type="button"
            className="btn btn-edit"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass">
      <div className="page-header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="header-text">
          <h1 className="header-title">
            {retiringFilter === 'this_year'
              ? `Retiring This Year (${CURRENT_YEAR})`
              : retiringFilter === 'next_year'
                ? `Retiring Next Year (${CURRENT_YEAR + 1})`
                : 'Employee Directory'}
          </h1>
          <p className="header-subtitle">
            <span className="tabular-nums">{filteredEmployees.length}</span> personnel records shown ·{' '}
            <span className="tabular-nums">{postedCount}</span> Posted ·{' '}
            <span className="tabular-nums">{notPostedCount}</span> Not Posted
          </p>
        </div>
      </div>

      {/* Posted & Not Posted Filter Pills */}
      <div className="posting-pills-bar" role="tablist" aria-label="Filter employees by posting status">
        <button
          type="button"
          className={`posting-filter-pill ${postingFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPostingFilter('all')}
        >
          <span>All Staff</span>
          <span className="pill-count tabular-nums">{employees.length}</span>
        </button>

        <button
          type="button"
          className={`posting-filter-pill pill-posted ${postingFilter === 'posted' ? 'active' : ''}`}
          onClick={() => setPostingFilter('posted')}
        >
          <span className="pill-dot dot-posted" />
          <span>Posted</span>
          <span className="pill-count tabular-nums">{postedCount}</span>
        </button>

        <button
          type="button"
          className={`posting-filter-pill pill-not-posted ${postingFilter === 'not_posted' ? 'active' : ''}`}
          onClick={() => setPostingFilter('not_posted')}
        >
          <span className="pill-dot dot-not-posted" />
          <span>Not Posted</span>
          <span className="pill-count tabular-nums">{notPostedCount}</span>
        </button>
      </div>

      {/* Dedicated Unposted / Not Posted Staff Callout */}
      {unpostedEmployees.length > 0 && postingFilter !== 'posted' && (
        <div className="unposted-panel">
          <div className="unposted-panel-header">
            <div className="unposted-panel-title-wrap">
              <span className="unposted-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <div>
                <h2 className="unposted-panel-title">
                  Not Posted / Unassigned Staff ({unpostedEmployees.length})
                </h2>
                <p className="unposted-panel-subtitle">
                  Staff awaiting UC posting assignment (hidden from UC Postings page)
                </p>
              </div>
            </div>
            {postingFilter === 'all' && (
              <button
                type="button"
                className="unposted-filter-btn"
                onClick={() => setPostingFilter('not_posted')}
              >
                Show Only Not Posted
              </button>
            )}
          </div>

          <div className="unposted-cards-grid">
            {unpostedEmployees.map((emp) => (
              <div
                key={emp.id}
                className="unposted-emp-card"
                onClick={() => {
                  setExpandedId(emp.id)
                }}
              >
                <div className="unposted-emp-top">
                  <div>
                    <div className="unposted-emp-name">{emp.employee_name}</div>
                    <div className="unposted-emp-meta">
                      {emp.designation} · {emp.parent_department}
                    </div>
                  </div>
                  <span className="emp-status-pill not-posted">
                    <span className="emp-status-dot" />
                    Not Posted
                  </span>
                </div>
                <div className="unposted-emp-bottom">
                  <span className="unposted-emp-cnic tabular-nums">
                    CNIC: {emp.cnic || '—'} {emp.tehsil ? `· ${emp.tehsil}` : ''}
                  </span>
                  <button
                    type="button"
                    className="unposted-assign-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(emp)
                    }}
                  >
                    Assign UC Posting
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="directory-toolbar">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, father name, CNIC, designation, or UC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <select
          className="tehsil-filter-select"
          value={tehsilFilter}
          onChange={(e) => setTehsilFilter(e.target.value)}
        >
          <option value="">All Tehsils</option>
          {tehsils.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-scroll">
        <div className="grid-header">
          <span className="grid-col grid-col-name">Employee &amp; CNIC</span>
          <span className="grid-col grid-col-desig">Designation &amp; Service</span>
          <span className="grid-col grid-col-uc">Posting Status &amp; UC</span>
        </div>
        <div className="data-list">
          {filteredEmployees.length === 0 ? (
            <div className="empty-directory-state">
              No employees match the selected filters.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isEditing = editingId === emp.id
              const isSaving = savingId === emp.id
              const posted = isEmployeePosted(emp)
              const statusInfo = getRetirementLabel(emp.date_of_superannuation)

              return (
                <div
                  key={emp.id}
                  className={`employee-wrapper ${!posted ? 'employee-wrapper-unposted' : ''}`}
                >
                  <div
                    className={`grid-row${expandedId === emp.id ? ' selected' : ''}${!posted ? ' grid-row-unposted' : ''}`}
                    onClick={() =>
                      setExpandedId(expandedId === emp.id ? null : emp.id)
                    }
                  >
                    <div className="grid-col grid-col-name">
                      <span className="grid-name-text">{emp.employee_name}</span>
                      <span className="grid-sub-text tabular-nums">
                        {emp.cnic || '—'} · S/O {emp.father_name || '—'}
                      </span>
                    </div>
                    <div className="grid-col grid-col-desig">
                      <span className="grid-primary-text">{emp.designation}</span>
                      <span className={`grid-status-text status-${statusInfo.tone}`}>
                        {statusInfo.text} · {emp.parent_department}
                      </span>
                    </div>
                    <div className="grid-col grid-col-uc">
                      <div className="uc-status-row">
                        <span
                          className={`emp-status-pill ${posted ? 'posted' : 'not-posted'}`}
                        >
                          <span className="emp-status-dot" />
                          {posted ? 'Posted' : 'Not Posted'}
                        </span>
                        {posted && (
                          <span className="grid-primary-text">{emp.uc}</span>
                        )}
                      </div>
                      <span className="grid-sub-text">
                        {emp.tehsil || 'Unassigned Tehsil'}
                      </span>
                    </div>
                  </div>
                  {expandedId === emp.id && (
                    <div className="grid-expanded">
                      <div className="expanded-content">
                        <div className="expanded-grid">
                          <div className="expanded-item">
                            <span className="expanded-label">Employee Name</span>
                            <span className="expanded-value">{emp.employee_name}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Father&apos;s Name</span>
                            <span className="expanded-value">{emp.father_name || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">CNIC</span>
                            <span className="expanded-value tabular-nums">{emp.cnic}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Address</span>
                            <span className="expanded-value">{emp.address || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Email</span>
                            <span className="expanded-value">{emp.email || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Contact</span>
                            <span className="expanded-value tabular-nums">{emp.contact || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Date of Birth</span>
                            <span className="expanded-value tabular-nums">{emp.date_of_birth || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Designation</span>
                            <span className="expanded-value">{emp.designation}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Department</span>
                            <span className="expanded-value">{emp.parent_department}</span>
                          </div>
                          {posted && (
                            <div className="expanded-item">
                              <span className="expanded-label">UC</span>
                              <span className="expanded-value">{emp.uc}</span>
                            </div>
                          )}
                          <div className="expanded-item">
                            <span className="expanded-label">Tehsil</span>
                            <span className="expanded-value">{emp.tehsil || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Cadre</span>
                            <span className="expanded-value">{emp.cadre || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Employment Status</span>
                            <span className="expanded-value">{emp.employment_status || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Service Status</span>
                            <span className="expanded-value">{emp.service_status || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Posting Status</span>
                            <span className="expanded-value">
                              <span className={`emp-status-pill ${posted ? 'posted' : 'not-posted'}`}>
                                <span className="emp-status-dot" />
                                {posted ? 'Posted' : 'Not Posted'}
                              </span>
                            </span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Posting Type</span>
                            <span className="expanded-value">{emp.posting_type || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Date of Appointment</span>
                            <span className="expanded-value tabular-nums">{emp.date_of_appointment || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Date of Regularization</span>
                            <span className="expanded-value tabular-nums">{emp.date_of_regularization || '—'}</span>
                          </div>
                          <div className="expanded-item">
                            <span className="expanded-label">Date of Superannuation</span>
                            <span className="expanded-value tabular-nums">{emp.date_of_superannuation || '—'}</span>
                          </div>
                        </div>
                        <div className="expanded-actions">
                          {isEditing ? (
                            <div className="edit-form-inline">
                              <select
                                className="edit-select-sm"
                                value={selectedTehsil}
                                onChange={(e) =>
                                  setSelectedTehsil(e.target.value)
                                }
                              >
                                <option value="">Select Tehsil</option>
                                {tehsils.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <select
                                className="edit-select-sm"
                                value={selectedUcId ?? ''}
                                onChange={(e) =>
                                  setSelectedUcId(
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                                disabled={!selectedTehsil}
                              >
                                <option value="">Select UC</option>
                                {filteredUcs.map((uc) => (
                                  <option key={uc.id} value={uc.id}>
                                    {uc.uc_name}
                                  </option>
                                ))}
                              </select>
                              <div className="edit-actions-inline">
                                <button
                                  type="button"
                                  className="btn btn-save"
                                  onClick={() => handleSave(emp)}
                                  disabled={
                                    !selectedTehsil || !selectedUcId || isSaving
                                  }
                                >
                                  {isSaving ? 'Saving...' : 'Save & Mark Posted'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-cancel"
                                  onClick={handleCancel}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <button
                                type="button"
                                className="action-btn action-view"
                                onClick={() => handleViewProfile(emp)}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a2 2 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                View Profile
                              </button>
                              <button
                                type="button"
                                className="action-btn action-edit"
                                onClick={() => openEdit(emp)}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                {posted ? 'Transfer UC' : 'Assign UC Posting'}
                              </button>
                              {posted && (
                                <button
                                  type="button"
                                  className="action-btn action-unpost"
                                  onClick={() => handleToggleNotPosted(emp)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? 'Updating...' : 'Mark Not Posted'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="action-btn action-delete"
                                onClick={() => handleDelete(emp)}
                                disabled={deletingId === emp.id}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                {deletingId === emp.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
