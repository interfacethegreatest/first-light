/** Local loading/error decoration; never reported as a loaded Three.js model. */
export default function SunFallback() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" data-sun-fallback>
      <circle cx="20" cy="20" r="10" fill="currentColor" opacity="0.55" />
      <path d="M20 3v4m0 26v4M3 20h4m26 0h4M8 8l3 3m18 18 3 3M8 32l3-3m18-18 3-3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
