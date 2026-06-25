import { useEffect, useState } from 'react'
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
} from '../lib/supabase'
import * as XLSX from 'xlsx'
import './Settings.css'

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

interface ColumnOption {
  key: string
  label: string
  defaultChecked: boolean
}

const COLUMN_OPTIONS: ColumnOption[] = [
  { key: 'employee_name', label: 'Employee Name', defaultChecked: true },
  { key: 'father_name', label: 'Father Name', defaultChecked: true },
  { key: 'cnic', label: 'CNIC', defaultChecked: true },
  { key: 'contact', label: 'Contact', defaultChecked: true },
  { key: 'email', label: 'Email', defaultChecked: true },
  { key: 'address', label: 'Address', defaultChecked: false },
  { key: 'date_of_birth', label: 'Date of Birth', defaultChecked: true },
  { key: 'designation', label: 'Designation', defaultChecked: true },
  { key: 'parent_department', label: 'Department', defaultChecked: true },
  { key: 'cadre', label: 'Cadre', defaultChecked: false },
  { key: 'employment_status', label: 'Employment Status', defaultChecked: true },
  { key: 'service_status', label: 'Service Status', defaultChecked: true },
  { key: 'posting_status', label: 'Posting Status', defaultChecked: true },
  { key: 'posting_type', label: 'Posting Type', defaultChecked: false },
  { key: 'date_of_appointment', label: 'Date of Appointment', defaultChecked: true },
  { key: 'date_of_regularization', label: 'Date of Regularization', defaultChecked: false },
  { key: 'date_of_superannuation', label: 'Date of Superannuation', defaultChecked: true },
  { key: 'tehsil', label: 'Tehsil', defaultChecked: true },
  { key: 'uc', label: 'UC', defaultChecked: true },
]

export default function Settings() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(COLUMN_OPTIONS.filter((c) => c.defaultChecked).map((c) => c.key))
  )

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      if (!isSupabaseConfigured) {
        setLoading(false)
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
          throw new Error(`HTTP ${res.status}: ${text}`)
        }

        const data = (await res.json()) as Employee[]
        setEmployees(data)
      } catch (err) {
        console.error('Failed to load employees for export:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedColumns(new Set(COLUMN_OPTIONS.map((c) => c.key)))
  }

  const clearAll = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = () => {
    if (employees.length === 0) return
    setExporting(true)

    try {
      const columns = COLUMN_OPTIONS.filter((c) => selectedColumns.has(c.key))
      if (columns.length === 0) {
        alert('Please select at least one column to export.')
        setExporting(false)
        return
      }

      const rows = employees.map((emp) => {
        const row: Record<string, string | number | null> = {}
        columns.forEach((col) => {
          const value = emp[col.key as keyof Employee]
          row[col.label] = value ?? ''
        })
        return row
      })

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Employees')

      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `employees_export_${date}.xlsx`)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const activeCount = selectedColumns.size

  return (
    <div className="glass settings-container">
      <div className="settings-header">
        <div className="settings-header-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83 2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div className="settings-header-text">
          <h2 className="settings-title">Settings</h2>
          <p className="settings-subtitle">Export employee data and configure preferences</p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <h3 className="settings-section-title">Export to Excel</h3>
            <p className="settings-section-desc">
              Download employee records as an Excel file. Choose which columns to include.
            </p>
          </div>
        </div>

        <div className="export-summary">
          <span className="export-count">{employees.length} employee(s) available</span>
          <span className="export-selected">{activeCount} column(s) selected</span>
        </div>

        <div className="export-actions">
          <button className="btn btn-export" onClick={selectAll}>
            Select All
          </button>
          <button className="btn btn-clear" onClick={clearAll}>
            Clear All
          </button>
          <button
            className="btn btn-export-primary"
            onClick={handleExport}
            disabled={exporting || loading || employees.length === 0}
          >
            {exporting ? (
              <>
                <span className="btn-spinner" />
                Exporting...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export to Excel
              </>
            )}
          </button>
        </div>

        <div className="columns-grid">
          {COLUMN_OPTIONS.map((col) => (
            <label key={col.key} className="column-option">
              <input
                type="checkbox"
                checked={selectedColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="column-checkbox"
              />
              <span className="column-label">{col.label}</span>
            </label>
          ))}
        </div>
      </div>

      {loading && (
        <div className="settings-loader">
          <div className="loader" />
          <p className="loading-text">Loading employee data...</p>
        </div>
      )}
    </div>
  )
}
