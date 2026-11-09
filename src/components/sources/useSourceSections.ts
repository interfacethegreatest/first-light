import { useState } from 'react'
import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'

export default function useSourceSections() {
  const [sourceSections, setSourceSections] = useState<SourceSectionInstance[]>([])

  function introduceSourceSection() {
    // Creation advances the template's content sequence, so keep it outside
    // React's replayable state updater.
    const section = sourceSectionTemplate.create()
    setSourceSections(current => [...current, section])
  }

  return { sourceSections, introduceSourceSection }
}
