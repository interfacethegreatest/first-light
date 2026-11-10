import type { CSSProperties } from 'react'

const LENS_ID = 'gls-liquid-glass-tab-bar-lens'

// Extracted verbatim from the supplied HTML reference, not a replacement map.
const DISPLACEMENT_MAP = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3ClinearGradient id='x'%3E%3Cstop offset='0' stop-color='%23800000'/%3E%3Cstop offset='0.12' stop-color='%23cc0000'/%3E%3Cstop offset='0.5' stop-color='%23800000'/%3E%3Cstop offset='0.88' stop-color='%23330000'/%3E%3Cstop offset='1' stop-color='%23800000'/%3E%3C/linearGradient%3E%3ClinearGradient id='y' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23008000'/%3E%3Cstop offset='0.14' stop-color='%2300b300'/%3E%3Cstop offset='0.5' stop-color='%23008000'/%3E%3Cstop offset='0.86' stop-color='%23004d00'/%3E%3Cstop offset='1' stop-color='%23008000'/%3E%3C/linearGradient%3E%3Crect width='1' height='1' fill='url(%23x)'/%3E%3Crect width='1' height='1' fill='url(%23y)' style='mix-blend-mode:screen'/%3E%3C/svg%3E"

export const appleGlassTheme = {
  '--apple-glass-lens': `url(#${LENS_ID})`,
} as CSSProperties

export default function AppleGlassLens() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      data-apple-glass-definitions
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      <filter id={LENS_ID} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        <feImage href={DISPLACEMENT_MAP} preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="20" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
