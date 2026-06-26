import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
} from '../lib/supabase'
import './Profile.css'

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

interface Props {
  employeeId: number | null
  onBack: () => void
}

export default function Profile({ employeeId, onBack }: Props) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Employee>>({})

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) return

      setLoading(true)
      setError(null)

      if (!isSupabaseConfigured) {
        setError('Supabase not configured')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/employee?id=eq.${employeeId}&select=*`,
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
          throw new Error(`HTTP ${res.status}: ${text}`)
        }

        const data = (await res.json()) as Employee[]
        if (data.length === 0) {
          throw new Error('Employee not found')
        }
        setEmployee(data[0])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId])

  const handleEdit = () => {
    if (!employee) return
    setFormData({ ...employee })
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({})
  }

  const handleSave = async () => {
    if (!employee || !employeeId) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/employee?id=eq.${employeeId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(formData),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      setEmployee({ ...employee, ...formData } as Employee)
      setEditing(false)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const getStatusColor = (dateStr: string) => {
    if (!dateStr) return 'rgba(255,255,255,0.3)'
    const d = new Date(dateStr)
    const yr = d.getFullYear()
    const now = new Date()
    if (yr < now.getFullYear()) return '#ef4444'
    if (yr === now.getFullYear()) return '#f97316'
    return '#22c55e'
  }

  const getStatusGlow = (dateStr: string) => {
    if (!dateStr) return 'transparent'
    const d = new Date(dateStr)
    const yr = d.getFullYear()
    const now = new Date()
    if (yr < now.getFullYear()) return 'rgba(239,68,68,0.4)'
    if (yr === now.getFullYear()) return 'rgba(249,115,22,0.4)'
    return 'rgba(34,197,94,0.4)'
  }

  if (loading) {
    return (
      <div className="glass profile-container">
        <div className="profile-loader">
          <div className="loader" />
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="glass profile-container">
        <div className="profile-error">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="error-title">Unable to load profile</p>
          <p className="error-message">{error ?? 'Employee not found'}</p>
          <button className="btn btn-back" onClick={onBack}>
            ← Back to Employee List
          </button>
        </div>
      </div>
    )
  }

  const initials = employee.employee_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="glass profile-container">
      <div className="profile-hero">
        <button className="btn btn-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        <div className="profile-identity">
          <div className="profile-avatar">
            <span className="avatar-initials">{initials}</span>
            <span
              className="status-indicator"
              style={{
                background: getStatusColor(employee.date_of_superannuation),
                boxShadow: `0 0 12px ${getStatusGlow(employee.date_of_superannuation)}`,
              }}
            />
          </div>
          <div className="profile-identity-text">
            <h1 className="profile-name">{employee.employee_name}</h1>
            <p className="profile-designation">{employee.designation}</p>
            <p className="profile-department">{employee.parent_department}</p>
          </div>
        </div>

        {editing ? (
          <div className="profile-hero-actions">
            <button
              className="btn btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-edit-profile" onClick={handleEdit}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="profile-error-banner">
          <p>{error}</p>
        </div>
      )}

      {editing ? (
        <div className="profile-edit-sections">
          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a2 2 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Personal Information
            </h3>
            <div className="profile-grid edit-grid">
              <ProfileInput label="Full Name" value={formData.employee_name ?? ''} onChange={(v) => updateField('employee_name', v)} />
              <ProfileInput label="Father Name" value={formData.father_name ?? ''} onChange={(v) => updateField('father_name', v)} />
              <ProfileInput label="CNIC" value={formData.cnic ?? ''} onChange={(v) => updateField('cnic', v)} />
              <ProfileInput label="Email" value={formData.email ?? ''} onChange={(v) => updateField('email', v)} />
              <ProfileInput label="Contact" value={formData.contact ?? ''} onChange={(v) => updateField('contact', v)} />
              <ProfileInput label="Address" value={formData.address ?? ''} onChange={(v) => updateField('address', v)} />
              <ProfileInput label="Date of Birth" value={formData.date_of_birth ?? ''} onChange={(v) => updateField('date_of_birth', v)} type="date" />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Service Details
            </h3>
            <div className="profile-grid edit-grid">
              <ProfileInput label="Designation" value={formData.designation ?? ''} onChange={(v) => updateField('designation', v)} />
              <ProfileInput label="Department" value={formData.parent_department ?? ''} onChange={(v) => updateField('parent_department', v)} />
              <ProfileInput label="Cadre" value={formData.cadre ?? ''} onChange={(v) => updateField('cadre', v)} />
              <ProfileInput label="Employment Status" value={formData.employment_status ?? ''} onChange={(v) => updateField('employment_status', v)} />
              <ProfileInput label="Service Status" value={formData.service_status ?? ''} onChange={(v) => updateField('service_status', v)} />
              <ProfileInput label="Date of Appointment" value={formData.date_of_appointment ?? ''} onChange={(v) => updateField('date_of_appointment', v)} type="date" />
              <ProfileInput label="Date of Regularization" value={formData.date_of_regularization ?? ''} onChange={(v) => updateField('date_of_regularization', v)} type="date" />
              <ProfileInput label="Date of Superannuation" value={formData.date_of_superannuation ?? ''} onChange={(v) => updateField('date_of_superannuation', v)} type="date" />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Posting Information
            </h3>
            <div className="profile-grid edit-grid">
              <ProfileInput label="Posting Status" value={formData.posting_status ?? ''} onChange={(v) => updateField('posting_status', v)} />
              <ProfileInput label="Posting Type" value={formData.posting_type ?? ''} onChange={(v) => updateField('posting_type', v)} />
              <ProfileInput label="Tehsil" value={formData.tehsil ?? ''} onChange={(v) => updateField('tehsil', v)} />
              <ProfileInput label="UC" value={formData.uc ?? ''} onChange={(v) => updateField('uc', v)} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="profile-stats">
            <div className="stat-card">
              <span className="stat-label">Status</span>
              <span className="stat-value status-badge" style={{
                color: getStatusColor(employee.date_of_superannuation),
                background: `${getStatusColor(employee.date_of_superannuation)}15`,
                border: `1px solid ${getStatusColor(employee.date_of_superannuation)}30`,
              }}>
                {employee.date_of_superannuation
                  ? (() => {
                      const yr = new Date(employee.date_of_superannuation).getFullYear()
                      const now = new Date()
                      if (yr < now.getFullYear()) return 'Retired'
                      if (yr === now.getFullYear()) return 'Retiring'
                      return 'Active'
                    })()
                  : 'Unknown'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">UC / Tehsil</span>
              <span className="stat-value">{employee.uc}</span>
              <span className="stat-sub">{employee.tehsil}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">CNIC</span>
              <span className="stat-value">{employee.cnic}</span>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a2 2 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Personal Information
            </h3>
            <div className="profile-grid">
              <ProfileField label="Full Name" value={employee.employee_name} />
              <ProfileField label="Father Name" value={employee.father_name} />
              <ProfileField label="CNIC" value={employee.cnic} />
              <ProfileField label="Email" value={employee.email} />
              <ProfileField label="Contact" value={employee.contact} />
              <ProfileField label="Address" value={employee.address} />
              <ProfileField label="Date of Birth" value={employee.date_of_birth} />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Service Details
            </h3>
            <div className="profile-grid">
              <ProfileField label="Designation" value={employee.designation} />
              <ProfileField label="Department" value={employee.parent_department} />
              <ProfileField label="Cadre" value={employee.cadre} />
              <ProfileField label="Employment Status" value={employee.employment_status} />
              <ProfileField label="Service Status" value={employee.service_status} />
              <ProfileField label="Date of Appointment" value={employee.date_of_appointment} />
              <ProfileField
                label="Date of Regularization"
                value={employee.date_of_regularization ?? '-'}
              />
              <ProfileField label="Date of Superannuation" value={employee.date_of_superannuation} />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Posting Information
            </h3>
            <div className="profile-grid">
              <ProfileField label="Posting Status" value={employee.posting_status} />
              <ProfileField label="Posting Type" value={employee.posting_type} />
              <ProfileField label="Tehsil" value={employee.tehsil} />
              <ProfileField label="UC" value={employee.uc} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value}</span>
    </div>
  )
}

function ProfileInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <input
        className="profile-field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
