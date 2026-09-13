interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }[size]
  return (
    <div
      className={`animate-spin rounded-full border-sand-mid border-t-rose ${sizeClass} ${className}`}
      role="status"
      aria-label="Chargement…"
    />
  )
}
