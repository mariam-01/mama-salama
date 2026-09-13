import type { TriageLevel } from '../types'

interface Props {
  level: TriageLevel
}

const CONFIG: Record<TriageLevel, { label: string; className: string }> = {
  GREEN: {
    label: 'Normal ✓',
    className: 'bg-sage-light text-sage border border-sage',
  },
  YELLOW: {
    label: 'Surveillance · JAUNE',
    className: 'bg-amber-light text-amber border border-amber',
  },
  RED: {
    label: 'URGENT · ROUGE',
    className: 'bg-[#FDEAEA] text-[#D94F4F] border border-[#D94F4F]',
  },
}

export default function TriageBadge({ level }: Props) {
  const { label, className } = CONFIG[level]
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
