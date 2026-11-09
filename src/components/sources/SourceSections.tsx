import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'

interface SourceSectionsProps {
  sections: SourceSectionInstance[]
  id?: string
}

export default function SourceSections({
  sections,
  id = 'source-sections',
}: SourceSectionsProps) {
  return (
    <div
      id={id}
      style={{
        display: 'grid',
        gap: 24,
        minWidth: 0,
        marginTop: sections.length ? 24 : 0,
        padding: sections.length ? 'clamp(8px, 1.5vw, 16px)' : 0,
      }}
    >
      {sections.map((section, index) =>
        sourceSectionTemplate.render(
          {
            ...section,
            borderTone: section.borderTone ?? (index % 2 === 0 ? 'aliceblue' : 'slatepurple'),
          },
          index + 1,
        ),
      )}
    </div>
  )
}
