import { useId, useState } from 'react'
import GlassPanel3D from './GlassPanel3D'
import styles from './ResearchDraftPanel.module.css'

export interface ResearchDraftPanelProps {
  /** Remove only the decorative scene; the native draft stays mounted. */
  mounted?: boolean
}

/** The original, simple glass-panel design, with a session-only native draft. */
export default function ResearchDraftPanel({ mounted = true }: ResearchDraftPanelProps) {
  const id = useId()
  const [draft, setDraft] = useState('')

  return (
    <GlassPanel3D mounted={mounted} aria-labelledby={`${id}-title`} contentClassName={styles.content}>
      <p className={styles.eyebrow}>FIRST LIGHT / REUSABLE COMPONENT</p>
      <h2 id={`${id}-title`} className={styles.title}>A little more depth.</h2>
      <p>Your content stays in HTML. A separate Three.js layer gives this panel its glass surface.</p>
      <label className={styles.field}>
        Research draft
        <textarea
          name="draft"
          rows={1}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Keep an idea here…"
          aria-describedby={`${id}-hint`}
        />
      </label>
      <span id={`${id}-hint`} className={styles.hint}>Temporary draft · Clears on reload</span>
    </GlassPanel3D>
  )
}
