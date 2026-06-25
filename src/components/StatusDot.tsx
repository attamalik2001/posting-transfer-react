import { useMemo } from 'react'

interface StatusDotProps {
  dateOfSuperannuation: string | null
  size?: number
}

export default function StatusDot({
  dateOfSuperannuation,
  size = 10,
}: StatusDotProps) {
  const color = useMemo(() => {
    if (!dateOfSuperannuation) return 'rgba(255,255,255,0.3)'
    const d = new Date(dateOfSuperannuation)
    const now = new Date()
    const currentYear = now.getFullYear()
    if (d.getFullYear() < currentYear) return '#ef4444'
    if (d.getFullYear() === currentYear) return '#f97316'
    return '#22c55e'
  }, [dateOfSuperannuation])

  return (
    <span
      className="status-dot"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  )
}
