interface Props {
  size?: number
  variant?: 'light' | 'dark'
  showText?: boolean
  className?: string
}

function IconMark({ size, variant }: { size: number; variant: 'light' | 'dark' }) {
  const onDark = variant === 'dark'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="50" fill={onDark ? 'white' : '#C2617A'} />
      <circle cx="50" cy="22" r="10" fill={onDark ? '#C2617A' : 'white'} />
      <path
        d="M 50,79 C 33,71 19,62 19,51 C 19,42 26,38 33,41 C 38,43 45,48 50,52 C 55,48 62,43 67,41 C 74,38 81,42 81,51 C 81,62 67,71 50,79 Z"
        fill={onDark ? '#C2617A' : 'white'}
      />
      <path
        d="M 50,69 C 44,65 38,61 38,56 C 38,52 41,50 44,52 C 46,53 49,55 50,57 C 51,55 54,53 56,52 C 59,50 62,52 62,56 C 62,61 56,65 50,69 Z"
        fill="#C47E2A"
      />
    </svg>
  )
}

export default function Logo({ size = 40, variant = 'light', showText = true, className = '' }: Props) {
  const textColor = variant === 'dark' ? 'text-white' : 'text-rose-dark'
  const subtitleColor = variant === 'dark' ? 'text-rose-mid' : 'text-rose'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <IconMark size={size} variant={variant} />

      {showText && (
        <>
          <div className="w-px h-8 bg-amber shrink-0" />
          <div>
            <div className={`font-serif text-xl leading-tight ${textColor}`}>
              Mama Salama
            </div>
            <div
              className={`text-base leading-tight ${subtitleColor}`}
              style={{ fontFamily: '"Amiri", serif', direction: 'rtl' }}
            >
              ماما سلامة
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function LogoMark({ size = 40, variant = 'light' }: Pick<Props, 'size' | 'variant'>) {
  return <IconMark size={size} variant={variant} />
}
