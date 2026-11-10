import { useState } from 'react'
import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'

export default function useSourceSections() {
  const [sourceSections, setSourceSections] = useState<SourceSectionInstance[]>([])

  function introduceSourceSection() {
    // Allocate each complete trio once, outside React's replayable updater.
    const sections = sourceSectionTemplate.createBatch()
    setSourceSections(current => [...current, ...sections])
  }

  return { sourceSections, introduceSourceSection }
}
