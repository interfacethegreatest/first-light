import type { ReactElement, ReactNode } from 'react'

export interface SourceSectionInstance {
  id: string
}

interface SourceSectionProps extends SourceSectionInstance {
  number: number
  children?: ReactNode
}

export const sourceSectionTemplate = {
  create: (): SourceSectionInstance => ({ id: crypto.randomUUID() }),
  render: (
    section: SourceSectionInstance,
    number: number,
    output?: ReactNode,
  ): ReactElement => (
    <SourceSection key={section.id} id={section.id} number={number}>
      {output}
    </SourceSection>
  ),
}

export default function SourceSection({ id, number, children }: SourceSectionProps) {
  const headingId = `source-section-${id}-heading`

  return (
    <section
      className="panel"
      aria-labelledby={headingId}
      style={{ width: '100%', minWidth: 0, height: 'auto', overflowWrap: 'anywhere' }}
    >
      <div className="panel-heading">
        <h3 id={headingId}>Source section {number}</h3>
      </div>
      <div className="entry-form source-content">
        {children ?? <p>New outputs will appear here.</p>}
      </div>
    </section>
  )
}
