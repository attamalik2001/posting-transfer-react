import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
} from '../lib/supabase'
import StatusDot from '../components/StatusDot'
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
}

export default function UcWise() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ucList, setUcList] = useState<UC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedUcId, setSelectedUcId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)

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

  const ucMap = new Map<string, UC>()
  ucList.forEach((uc) => ucMap.set(uc.uc_name, uc))

  const grouped = new Map<string, Employee[]>()
  employees.forEach((emp) => {
    const key = emp.uc || '(Unassigned)'
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(emp)
  })

  const sortedGroups: UcGroup[] = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ucName, emps]) => {
      const ucInfo = ucMap.get(ucName)
      return {
        ucName,
        tehsil: ucInfo?.tehsil || emps[0]?.tehsil || '',
        employees: emps,
      }
    })

  const tehsils = Array.from(new Set(ucList.map((uc) => uc.tehsil))).sort()

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
        <p className="loading-text">Loading UC-wise data...</p>
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
          <h2 className="header-title">UC-wise Posting</h2>
          <p className="header-subtitle">{sortedGroups.length} UCs with employees</p>
        </div>
      </div>
      <div className="uc-grid">
        {sortedGroups.map((group) => (
          <div key={group.ucName} className="uc-card">
            <div className="uc-card-header">
              <div className="uc-header-left">
                <h3 className="uc-name">{group.ucName}</h3>
                <span className="uc-tehsil">{group.tehsil}</span>
              </div>
              <span className="uc-count-badge">{group.employees.length} employee(s)</span>
            </div>
            <div className="uc-employees">
              {group.employees.map((emp) => {
                const isEditing = editingId === emp.id
                const isSaving = savingId === emp.id

                return (
                  <div
                    key={emp.id}
                    className={`uc-employee-row${selectedEmployeeId === emp.id ? ' selected' : ''}`}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  >
                    <div className="uc-employee-main">
                      <div className="uc-emp-info">
                        <span className="uc-emp-name">
                          <span className="data-value-with-dot">
                            {emp.employee_name}
                            <StatusDot dateOfSuperannuation={emp.date_of_superannuation} />
                          </span>
                        </span>
                        <span className="uc-emp-meta">
                          {emp.designation} · {emp.parent_department}
                        </span>
                      </div>
                      {!isEditing && (
                        <div className="uc-emp-actions">
                          <button
                            className="icon-btn icon-edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(emp)
                            }}
                            title="Update Posting"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="edit-form">
                        <div className="edit-field">
                          <label className="edit-label">Tehsil</label>
                          <select
                            className="edit-select"
                            value={selectedTehsil}
                            onClick={(e) => e.stopPropagation()}
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
                          <label className="edit-label">UC</label>
                          <select
                            className="edit-select"
                            value={selectedUcId ?? ''}
                            onClick={(e) => e.stopPropagation()}
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
                            className="btn btn-save"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSave(emp)
                            }}
                            disabled={
                              !selectedTehsil || !selectedUcId || isSaving
                            }
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="btn btn-cancel"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancel()
                            }}
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
        ))}
      </div>
    </div>
  )
}
