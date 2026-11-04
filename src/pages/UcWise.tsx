import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  supabaseFetch,
} from '../lib/supabase'
import './UcWise.css'

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

interface UcGroup {
  ucName: string
  tehsil: string
  employees: Employee[]
  hasNaibQasid: boolean
  hasSecretaryOrClerk: boolean
  isHighlighted: boolean
}

type StaffingFilter = 'all' | 'highlighted' | 'no_nq' | 'no_sec' | 'complete'

const SECRETARY_OR_CLERK_ROLES = [
  'secretary cd',
  'secretary uc',
  'secretary tech',
  'get clerk',
]

function isNaibQasidRole(designation?: string | null): boolean {
  if (!designation) return false
  return designation.trim().toLowerCase() === 'naib qasid'
}

function isSecretaryOrClerkRole(designation?: string | null): boolean {
  if (!designation) return false
  const norm = designation.trim().toLowerCase()
  return SECRETARY_OR_CLERK_ROLES.includes(norm)
}

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
  onViewProfile?: (id: number) => void
}

export default function UcWise({ onViewProfile }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ucList, setUcList] = useState<UC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedUcId, setSelectedUcId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTehsil, setFilterTehsil] = useState('')
  const [staffingFilter, setStaffingFilter] = useState<StaffingFilter>('all')

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

  const ucMap = new Map<string, UC>()
  const grouped = new Map<string, Employee[]>()

  ucList.forEach((uc) => {
    ucMap.set(uc.uc_name, uc)
    if (!grouped.has(uc.uc_name)) {
      grouped.set(uc.uc_name, [])
    }
  })

  const postedEmployees = employees.filter(isEmployeePosted)

  postedEmployees.forEach((emp) => {
    const key = emp.uc.trim()
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(emp)
  })

  const allGroups: UcGroup[] = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ucName, emps]) => {
      const ucInfo = ucMap.get(ucName)
      const hasNaibQasid = emps.some((e) => isNaibQasidRole(e.designation))
      const hasSecretaryOrClerk = emps.some((e) => isSecretaryOrClerkRole(e.designation))
      const isHighlighted = !hasNaibQasid || !hasSecretaryOrClerk

      return {
        ucName,
        tehsil: ucInfo?.tehsil || emps[0]?.tehsil || '',
        employees: emps,
        hasNaibQasid,
        hasSecretaryOrClerk,
        isHighlighted,
      }
    })

  const noNqCount = allGroups.filter((g) => !g.hasNaibQasid).length
  const noSecCount = allGroups.filter((g) => !g.hasSecretaryOrClerk).length
  const highlightedCount = allGroups.filter((g) => g.isHighlighted).length

  const sortedGroups = allGroups.filter((group) => {
    if (filterTehsil && group.tehsil !== filterTehsil) return false
    if (staffingFilter === 'highlighted' && !group.isHighlighted) return false
    if (staffingFilter === 'no_nq' && group.hasNaibQasid) return false
    if (staffingFilter === 'no_sec' && group.hasSecretaryOrClerk) return false
    if (staffingFilter === 'complete' && group.isHighlighted) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      group.ucName.toLowerCase().includes(q) ||
      group.tehsil.toLowerCase().includes(q) ||
      group.employees.some(
        (e) =>
          e.employee_name?.toLowerCase().includes(q) ||
          e.designation?.toLowerCase().includes(q)
      )
    )
  })

  const tehsils = Array.from(
    new Set([
      ...ucList.map((uc) => uc.tehsil),
      ...employees.map((e) => e.tehsil),
    ].filter(Boolean))
  ).sort()

  const filteredUcs =
    selectedTehsil && editingId !== null
      ? ucList.filter((uc) => uc.tehsil === selectedTehsil)
      : []

  const openEdit = (emp: Employee) => {
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
        <p className="loading-text">Loading UC-wise postings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass data-container">
        <div className="error-state">
          <p className="error-title">Unable to load data</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass">
      <div className="page-header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="header-text">
          <h1 className="header-title">UC-wise Postings</h1>
          <p className="header-subtitle">
            <span className="tabular-nums">{sortedGroups.length}</span> Union Councils shown ·{' '}
            <span className="tabular-nums">{noNqCount}</span> without Naib Qasid ·{' '}
            <span className="tabular-nums">{noSecCount}</span> without Secretary / GET Clerk
          </p>
        </div>
      </div>

      <div className="uc-filter-tabs" role="tablist" aria-label="Filter Union Councils by staffing status">
        <button
          type="button"
          className={`uc-filter-tab ${staffingFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStaffingFilter('all')}
        >
          All UCs ({allGroups.length})
        </button>
        <button
          type="button"
          className={`uc-filter-tab uc-filter-tab-highlight ${staffingFilter === 'highlighted' ? 'active' : ''}`}
          onClick={() => setStaffingFilter('highlighted')}
        >
          Highlighted Vacancies ({highlightedCount})
        </button>
        <button
          type="button"
          className={`uc-filter-tab uc-filter-tab-warn ${staffingFilter === 'no_nq' ? 'active' : ''}`}
          onClick={() => setStaffingFilter('no_nq')}
        >
          No Naib Qasid ({noNqCount})
        </button>
        <button
          type="button"
          className={`uc-filter-tab uc-filter-tab-danger ${staffingFilter === 'no_sec' ? 'active' : ''}`}
          onClick={() => setStaffingFilter('no_sec')}
        >
          No Secretary / Clerk ({noSecCount})
        </button>
        <button
          type="button"
          className={`uc-filter-tab ${staffingFilter === 'complete' ? 'active' : ''}`}
          onClick={() => setStaffingFilter('complete')}
        >
          Fully Staffed ({allGroups.length - highlightedCount})
        </button>
      </div>

      <div className="directory-toolbar">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Union Council, Tehsil, or assigned employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearchQuery('')}
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
          value={filterTehsil}
          onChange={(e) => setFilterTehsil(e.target.value)}
        >
          <option value="">All Tehsils</option>
          {tehsils.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="uc-grid">
        {sortedGroups.map((group) => {
          const cardStateClass = !group.hasNaibQasid && !group.hasSecretaryOrClerk
            ? 'uc-card-missing-both'
            : !group.hasNaibQasid
              ? 'uc-card-missing-nq'
              : !group.hasSecretaryOrClerk
                ? 'uc-card-missing-sec'
                : ''

          return (
            <div key={group.ucName} className={`uc-card ${cardStateClass}`}>
              <div className="uc-card-header">
                <div className="uc-header-left">
                  <h2 className="uc-name">{group.ucName}</h2>
                  <span className="uc-tehsil">
                    {group.tehsil || 'Unassigned Tehsil'} ·{' '}
                    <span className="tabular-nums">{group.employees.length} posted</span>
                  </span>
                </div>
                {group.isHighlighted && (
                  <span
                    className={`uc-vacancy-label ${
                      !group.hasSecretaryOrClerk ? 'vacancy-danger' : 'vacancy-warn'
                    }`}
                  >
                    {!group.hasNaibQasid && !group.hasSecretaryOrClerk
                      ? 'Vacant UC'
                      : !group.hasNaibQasid
                        ? 'No Naib Qasid'
                        : 'No Secretary / Clerk'}
                  </span>
                )}
              </div>

              {group.isHighlighted && (
                <div
                  className={`uc-highlight-banner ${
                    !group.hasSecretaryOrClerk ? 'banner-danger' : 'banner-warn'
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>
                    {!group.hasNaibQasid && group.hasSecretaryOrClerk
                      ? 'No Naib Qasid posted — only Secretary / GET Clerk assigned'
                      : group.hasNaibQasid && !group.hasSecretaryOrClerk
                        ? 'No Secretary CD / UC / Tech or GET Clerk posted'
                        : 'Neither Naib Qasid nor Secretary / GET Clerk posted'}
                  </span>
                </div>
              )}

              <div className="uc-employees">
                {group.employees.map((emp) => {
                  const isEditing = editingId === emp.id
                  const isSaving = savingId === emp.id

                  return (
                    <div
                      key={emp.id}
                      className={`uc-employee-row${selectedEmployeeId === emp.id ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id)
                        if (onViewProfile && !isEditing) {
                          onViewProfile(emp.id)
                        }
                      }}
                    >
                      <div className="uc-employee-main">
                        <div className="uc-emp-info">
                          <span className="uc-emp-name">{emp.employee_name}</span>
                          <span className="uc-emp-meta">
                            {emp.designation} · {emp.parent_department}
                          </span>
                        </div>
                        {!isEditing && (
                          <div className="uc-emp-actions">
                            <button
                              type="button"
                              className="icon-edit"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(emp)
                              }}
                              title="Transfer Posting"
                            >
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="edit-form" onClick={(e) => e.stopPropagation()}>
                          <div className="edit-field">
                            <label className="edit-label">Tehsil</label>
                            <select
                              className="edit-select"
                              value={selectedTehsil}
                              onChange={(e) =>
                                setSelectedTehsil(e.target.value)
                              }
                            >
                              <option value="">Select Tehsil</option>
                              {tehsils.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="edit-field">
                            <label className="edit-label">Union Council</label>
                            <select
                              className="edit-select"
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
                          </div>
                          <div className="edit-actions">
                            <button
                              type="button"
                              className="btn btn-save"
                              onClick={() => handleSave(emp)}
                              disabled={
                                !selectedTehsil || !selectedUcId || isSaving
                              }
                            >
                              {isSaving ? 'Saving...' : 'Save Posting'}
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
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
