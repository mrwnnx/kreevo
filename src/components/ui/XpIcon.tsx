// XP icon — gold lightning bolt (from flash-sale.svg). Sized via className (w/h).
// The gradient id is fixed; duplicate ids across instances resolve identically.
export function XpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <linearGradient id="xpGrad" gradientUnits="userSpaceOnUse" x1="6.043" x2="15.957" y1="5.543" y2="15.457">
        <stop offset="0" stopColor="#fd0" />
        <stop offset="1" stopColor="#feb100" />
      </linearGradient>
      <path
        d="m19.906 8.576a1 1 0 0 0 -.906-.576h-4.382l2.276-4.553a1 1 0 0 0 -.894-1.447h-6a1 1 0 0 0 -.874.514l-5 9a1 1 0 0 0 .874 1.486h4.753l-1.729 7.783a1 1 0 0 0 1.744.857l10-12a1 1 0 0 0 .138-1.064z"
        fill="url(#xpGrad)"
      />
    </svg>
  )
}
