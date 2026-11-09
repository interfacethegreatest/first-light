import type { ReactNode } from 'react'

// Calendar4's section boilerplate supplies a title/edit row and plain p content:
// src/components/sections/AboutMe/AboutMe.tsx at 7b7e533.
export const DEFAULT_SOURCE_SECTION_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

const BORDER_COLOURS = {
  aliceblue: 'rgba(240, 248, 255, 0.16)',
  // Custom token: slatepurple is not a standard CSS colour keyword.
  slatepurple: 'rgba(123, 104, 238, 0.28)',
} as const

export type SourceSectionBorderTone = keyof typeof BORDER_COLOURS

export interface SourceSectionInstance {
  id: string
  text?: string
  borderTone?: SourceSectionBorderTone
}

interface SourceSectionProps extends SourceSectionInstance {
  number: number
  children?: ReactNode
  controls?: ReactNode
}

export default function SourceSection({ id, number, text = DEFAULT_SOURCE_SECTION_TEXT, borderTone = 'aliceblue', children, controls }: SourceSectionProps) {
  const headingId = `source-section-${id}-heading`

  return (
    <section
      className="panel"
      aria-labelledby={headingId}
      style={{
        width: '100%',
        minWidth: 0,
        height: 'auto',
        overflowWrap: 'anywhere',
        border: '1px solid rgba(225, 231, 255, 0.10)',
        borderTop: `1px solid ${BORDER_COLOURS[borderTone]}`,
        borderRadius: 16,
        background: 'linear-gradient(160deg, rgba(35, 39, 56, 0.96), rgba(20, 23, 35, 0.98))',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        className="panel-heading"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          background: 'rgba(255, 255, 255, 0.025)',
        }}
      >
        <h3 id={headingId} style={{ flex: 1, minWidth: 0 }}>Source section {number}</h3>
        {controls && (
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', flexShrink: 0, gap: 8, whiteSpace: 'nowrap' }}>
            {controls}
          </div>
        )}
      </div>
      <div className="entry-form source-content" style={{ padding: 20 }}>
        {children ?? <p>{text}</p>}
      </div>
    </section>
  )
}
