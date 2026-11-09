import type { ReactNode } from 'react'

// Calendar4's section boilerplate supplies a title/edit row and plain p content:
// src/components/sections/AboutMe/AboutMe.tsx at 7b7e533.
export const DEFAULT_SOURCE_SECTION_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

const BORDER_COLOURS = {
  aliceblue: '#F0F8FF',
  // Custom token: slatepurple is not a standard CSS colour keyword.
  slatepurple: '#7B68EE',
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
      style={{ width: '100%', minWidth: 0, height: 'auto', overflowWrap: 'anywhere', border: `2px solid ${BORDER_COLOURS[borderTone]}` }}
    >
      <div
        className="panel-heading"
        style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <h3 id={headingId} style={{ flex: 1, minWidth: 0 }}>Source section {number}</h3>
        {controls && (
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', flexShrink: 0, gap: 8, whiteSpace: 'nowrap' }}>
            {controls}
          </div>
        )}
      </div>
      <div className="entry-form source-content">
        {children ?? <p>{text}</p>}
      </div>
    </section>
  )
}
