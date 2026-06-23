interface BrandLogoProps {
  className?: string
  compact?: boolean
}

export function BrandLogo({ className = '', compact = false }: BrandLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox={compact ? '0 0 220 64' : '0 0 320 108'}
        aria-label="DishLingo"
        role="img"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id="dishlingoBubble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6432" />
            <stop offset="100%" stopColor="#ff3a1a" />
          </linearGradient>
          <filter id="dishlingoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#ff5a2e" floodOpacity="0.18" />
          </filter>
        </defs>

        <g transform={compact ? 'translate(10 10)' : 'translate(16 10)'} filter="url(#dishlingoShadow)">
          <path
            d="M48 0C21.5 0 0 20.4 0 45.7c0 13.9 6.6 26.4 17 34.8l-4.7 13.1 15.5-8.3c6.1 2 12.7 3 20.2 3 26.5 0 48-20.4 48-45.6C96 20.4 74.5 0 48 0Z"
            fill="url(#dishlingoBubble)"
          />
          <ellipse cx="48" cy="46" rx="34" ry="28" fill="#ffffff" />
          <circle cx="32" cy="49" r="4.5" fill="#102754" />
          <circle cx="48" cy="49" r="4.5" fill="#102754" />
          <circle cx="64" cy="49" r="4.5" fill="#102754" />
          <rect x="58" y="-4" width="8" height="54" rx="2.5" transform="rotate(48 58 -4)" fill="#102754" />
          <rect x="72" y="-2" width="8" height="54" rx="2.5" transform="rotate(52 72 -2)" fill="#102754" />
        </g>

        <g transform={compact ? 'translate(106 18)' : 'translate(132 22)'}>
          <text x="0" y="40" fontSize={compact ? '38' : '52'} fontWeight="800" fontFamily="Arial, Helvetica, sans-serif">
            <tspan fill="#102754">Dish</tspan>
            <tspan fill="#ff4a21">Lingo</tspan>
          </text>
          {!compact && (
            <text
              x="1"
              y="72"
              fontSize="9.5"
              letterSpacing="3.2"
              fontWeight="700"
              fill="#243b6a"
              fontFamily="Arial, Helvetica, sans-serif"
            >
              LOCAL WORDS, BETTER MENUS.
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}
