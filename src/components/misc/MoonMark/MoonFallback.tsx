export default function MoonFallback({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-moon-fallback
    >
      <path
        d="M52.7 38.2A24 24 0 1 1 25.8 11.3a19 19 0 0 0 26.9 26.9Z"
        fill="currentColor"
      />
    </svg>
  )
}
