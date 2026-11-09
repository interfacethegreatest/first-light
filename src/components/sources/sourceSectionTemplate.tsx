import type { ReactElement, ReactNode } from 'react'
import SourceSection, { DEFAULT_SOURCE_SECTION_TEXT, type SourceSectionBorderTone, type SourceSectionInstance } from './SourceSection'

const IPSUM_LENGTHS = [1, 4, 12] as const
let nextIpsumLength = 0

// Reusable boilerplate: create an instance, then render it with optional output
// and title controls. This module does not depend on App or workspace storage.
export const sourceSectionTemplate = {
  create: (borderTone?: SourceSectionBorderTone): SourceSectionInstance => {
    const repeats = IPSUM_LENGTHS[nextIpsumLength]
    nextIpsumLength = (nextIpsumLength + 1) % IPSUM_LENGTHS.length
    return {
      id: crypto.randomUUID(),
      text: Array(repeats).fill(DEFAULT_SOURCE_SECTION_TEXT).join(' '),
      borderTone,
    }
  },
  render: (
    section: SourceSectionInstance,
    number: number,
    output?: ReactNode,
    controls?: ReactNode,
  ): ReactElement => (
    <SourceSection key={section.id} {...section} number={number} controls={controls}>
      {output}
    </SourceSection>
  ),
}
