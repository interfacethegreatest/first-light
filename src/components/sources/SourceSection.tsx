import type { ReactNode } from 'react'
import NewUserCard from '../cards/newUserCard/NewUserCard'

// Calendar4's section boilerplate supplies a title/edit row and plain p content:
// src/components/sections/AboutMe/AboutMe.tsx at 7b7e533.
export const DEFAULT_SOURCE_SECTION_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

export type SourceSectionBorderTone = 'aliceblue' | 'slatepurple'

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
    <NewUserCard
      headingId={headingId}
      title={`Source section ${number}`}
      controls={controls}
      borderTone={borderTone}
      surfaceClassName="workspace-panel-surface"
    >
      {children ?? <p>{text}</p>}
    </NewUserCard>
  )
}
