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
      style={{ display: 'grid', gap: 24, marginTop: sections.length ? 24 : 0 }}
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
