/** A quiet local placeholder, never presented as the textured Earth model. */
export default function EarthFallback() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15"
      aria-hidden="true" focusable="false" data-earth-fallback>
      <circle cx="12" cy="12" r="9.25" />
      <ellipse cx="12" cy="12" rx="4.3" ry="9.25" />
      <path d="M3 12h18M4.2 7.4h15.6M4.2 16.6h15.6" />
    </svg>
  )
}
