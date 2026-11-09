import { useCallback, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { SourceSectionInstance } from './SourceSection'
import { sourceSectionTemplate } from './sourceSectionTemplate'
import AnimatedHeight, { type HeightSettlement } from './AnimatedHeight'

interface SourceSectionsProps {
  sections: SourceSectionInstance[]
  id?: string
}

interface SourceReveal {
  target: 'visible' | 'settled'
  delay: number
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8, transition: { duration: 0 } },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut', delay, when: 'beforeChildren' },
  }),
  settled: {
    opacity: 1,
    y: 0,
    transition: { duration: 0, delay: 0, when: 'beforeChildren' },
  },
}

export default function SourceSections({
  sections,
  id = 'source-sections',
}: SourceSectionsProps) {
  // Already-present sections do not need an entrance. Newly added sections
  // stay in normal layout for measurement, then join the completed batch.
  const [reveals, setReveals] = useState(() => new Map<string, SourceReveal>(
    sections.map(section => [section.id, { target: 'settled', delay: 0 }]),
  ))

  const revealPending = useCallback(({ immediate }: HeightSettlement) => {
    setReveals(current => {
      const next = new Map<string, SourceReveal>()
      let changed = current.size !== sections.length
      let added = 0

      for (const section of sections) {
        const previous = current.get(section.id)
        const reveal: SourceReveal = previous
          ? immediate && previous.target !== 'settled'
            ? { target: 'settled', delay: 0 }
            : previous
          : { target: immediate ? 'settled' : 'visible', delay: immediate ? 0 : added++ * 0.12 }
        next.set(section.id, reveal)
        if (reveal !== previous) changed = true
      }

      return changed ? next : current
    })
  }, [sections])

  const settleReveal = useCallback((id: string) => {
    setReveals(current => {
      if (current.get(id)?.target !== 'visible') return current
      const next = new Map(current)
      next.set(id, { target: 'settled', delay: 0 })
      return next
    })
  }, [])

  return (
    <AnimatedHeight onSettled={revealPending}>
      <div
        id={id}
        style={{
          display: 'grid',
          gap: 24,
          minWidth: 0,
          marginTop: sections.length ? 24 : 0,
          padding: sections.length ? 'clamp(8px, 1.5vw, 16px)' : 0,
          paddingLeft: sections.length ? 'clamp(4px, 0.75vw, 8px)' : 0,
        }}
      >
        {sections.map((section, index) => {
          const reveal = reveals.get(section.id)
          return (
            <motion.div
              key={section.id}
              data-source-reveal={reveal?.target ?? 'waiting'}
              variants={panelVariants}
              initial={reveal?.target === 'settled' ? false : 'hidden'}
              animate={reveal?.target ?? 'hidden'}
              custom={reveal?.delay ?? 0}
              inert={!reveal || undefined}
              aria-hidden={!reveal || undefined}
              style={{ width: '100%', minWidth: 0, visibility: reveal ? 'visible' : 'hidden' }}
              onFocusCapture={() => settleReveal(section.id)}
              onAnimationComplete={definition => {
                if (definition === 'visible') settleReveal(section.id)
              }}
            >
              {sourceSectionTemplate.render(
                {
                  ...section,
                  borderTone: section.borderTone ?? (index % 2 === 0 ? 'aliceblue' : 'slatepurple'),
                },
                index + 1,
              )}
            </motion.div>
          )
        })}
      </div>
    </AnimatedHeight>
  )
}
