import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
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

interface Props {
  onViewProfile: (id: number) => void
}

export default function Data({ onViewProfile }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ucList, setUcList] = useState<UC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
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
        const empRes = await fetch(
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

        const ucRes = await fetch(
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

  const tehsils = Array.from(new Set(ucList.map((uc) => uc.tehsil))).sort()

  const employeesSortedByUc = [...employees].sort((a, b) =>
    a.uc.localeCompare(b.uc)
  )

  const filteredUcs =
    selectedTehsil && editingId !== null
      ? ucList.filter((uc) => uc.tehsil === selectedTehsil)
      : []

  const filteredEmployees = employeesSortedByUc.filter((emp) => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    return (
      emp.employee_name?.toLowerCase().includes(term) ||
      emp.father_name?.toLowerCase().includes(term) ||
      emp.cnic?.toLowerCase().includes(term) ||
      emp.designation?.toLowerCase().includes(term)
    )
  })

  const handleViewProfile = (emp: Employee) => {
    onViewProfile(emp.id)
  }

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

  const handleDelete = async (emp: Employee) => {
    if (
      !confirm(
        `Are you sure you want to delete ${emp.employee_name}? This cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(emp.id)

    try {
      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      }

      const delRes = await fetch(
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

      const postingCheckRes = await fetch(
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
        const patchRes = await fetch(
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
        const postRes = await fetch(`${supabaseUrl}/rest/v1/posting`, {
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

      const empPatchRes = await fetch(
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
            ? { ...e, tehsil: selectedUc.tehsil, uc: selectedUc.uc_name }
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
        <p className="loading-text">Loading employees...</p>
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="header-text">
          <h2 className="header-title">Employees</h2>
          <p className="header-subtitle">{filteredEmployees.length} records found</p>
        </div>
      </div>
      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
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
      <div className="grid-scroll">
        <div className="grid-header">
          <span className="grid-col grid-col-name">Name</span>
          <span className="grid-col grid-col-desig">Designation</span>
          <span className="grid-col grid-col-uc">UC</span>
        </div>
        <div className="data-list">
        {filteredEmployees.map((emp) => {
          const isEditing = editingId === emp.id
          const isSaving = savingId === emp.id

          return (
            <div key={emp.id} className="employee-wrapper">
              <div
                className={`grid-row${expandedId === emp.id ? ' selected' : ''}`}
                onPointerUp={() =>
                  setExpandedId(expandedId === emp.id ? null : emp.id)
                }
                >
                <span className="grid-col grid-col-name">
                  <span className="grid-name-inner">
                    <span
                      className="status-dot status-dot-sm"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        display: 'inline-block',
                        flexShrink: 0,
                        background: emp.date_of_superannuation
                          ? (() => {
                              const d = new Date(emp.date_of_superannuation)
                              const yr = d.getFullYear()
                              const now = new Date()
                              return yr < now.getFullYear() ? '#ef4444'
                                : yr === now.getFullYear() ? '#f97316' : '#22c55e'
                            })()
                          : 'rgba(255,255,255,0.3)',
                        boxShadow: `0 0 6px ${emp.date_of_superannuation
                          ? (() => {
                              const d = new Date(emp.date_of_superannuation)
                              const yr = d.getFullYear()
                              const now = new Date()
                              return yr < now.getFullYear() ? 'rgba(239,68,68,0.5)'
                                : yr === now.getFullYear() ? 'rgba(249,115,22,0.5)' : 'rgba(34,197,94,0.5)'
                            })()
                          : 'transparent'}`,
                      }}
                    />
                    <span className="grid-name-text">{emp.employee_name}</span>
                  </span>
                </span>
                <span className="grid-col grid-col-desig">{emp.designation}</span>
                <span className="grid-col grid-col-uc">{emp.uc}</span>
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
                        <span className="expanded-label">Father's Name</span>
                        <span className="expanded-value">{emp.father_name || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">CNIC</span>
                        <span className="expanded-value">{emp.cnic}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Address</span>
                        <span className="expanded-value">{emp.address}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Email</span>
                        <span className="expanded-value">{emp.email || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Contact</span>
                        <span className="expanded-value">{emp.contact}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Date of Birth</span>
                        <span className="expanded-value">{emp.date_of_birth || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Designation</span>
                        <span className="expanded-value">{emp.designation}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Department</span>
                        <span className="expanded-value">{emp.parent_department}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">UC</span>
                        <span className="expanded-value">{emp.uc}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Tehsil</span>
                        <span className="expanded-value">{emp.tehsil}</span>
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
                        <span className="expanded-value">{emp.posting_status || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Posting Type</span>
                        <span className="expanded-value">{emp.posting_type || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Date of Appointment</span>
                        <span className="expanded-value">{emp.date_of_appointment || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Date of Regularization</span>
                        <span className="expanded-value">{emp.date_of_regularization || '—'}</span>
                      </div>
                      <div className="expanded-item">
                        <span className="expanded-label">Date of Superannuation</span>
                        <span className="expanded-value">{emp.date_of_superannuation || '—'}</span>
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
                            <option value="">Tehsil</option>
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
                            <option value="">UC</option>
                            {filteredUcs.map((uc) => (
                              <option key={uc.id} value={uc.id}>
                                {uc.uc_name}
                              </option>
                            ))}
                          </select>
                          <div className="edit-actions-inline">
                            <button
                              className="btn btn-save btn-icon-only"
                              onClick={() => handleSave(emp)}
                              disabled={
                                !selectedTehsil || !selectedUcId || isSaving
                              }
                            >
                              {isSaving ? '...' : '✓'}
                            </button>
                            <button
                              className="btn btn-cancel btn-icon-only"
                              onClick={handleCancel}
                              disabled={isSaving}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button
                            className="icon-btn icon-view btn-icon-only"
                            onClick={() => handleViewProfile(emp)}
                            title="View Profile"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn icon-edit btn-icon-only"
                            onClick={() => openEdit(emp)}
                            title="Update Posting"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn icon-delete btn-icon-only"
                            onClick={() => handleDelete(emp)}
                            disabled={deletingId === emp.id}
                            title="Delete"
                          >
                            {deletingId === emp.id ? (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

