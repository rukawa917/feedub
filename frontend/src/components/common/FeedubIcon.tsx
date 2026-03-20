/**
 * FeedubIcon component - The Nexus brand icon
 * Central hub with converging paths representing message aggregation
 */

interface FeedubIconProps {
  /** Icon size in pixels */
  size?: number
  /** Additional CSS classes */
  className?: string
}

export function FeedubIcon({ size = 24, className = '' }: FeedubIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="feedub-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="512" height="512" rx="96" fill="url(#feedub-icon-grad)" />

      {/* Converging lines from corners */}
      <path
        d="M80 80 L220 220"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M432 80 L292 220"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M80 432 L220 292"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M432 432 L292 292"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Side inputs */}
      <path
        d="M60 256 L200 256"
        stroke="white"
        strokeWidth="32"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M452 256 L312 256"
        stroke="white"
        strokeWidth="32"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M256 60 L256 200"
        stroke="white"
        strokeWidth="32"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Central hub */}
      <circle cx="256" cy="256" r="72" fill="white" />
      <circle cx="256" cy="256" r="44" fill="url(#feedub-icon-grad)" />
      <circle cx="256" cy="256" r="24" fill="white" opacity="0.8" />
    </svg>
  )
}
