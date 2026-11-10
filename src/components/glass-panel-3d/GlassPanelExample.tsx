import { useState } from 'react'
import GlassPanel3D from './GlassPanel3D'
import { useGlassPanelMount } from './useGlassPanelMount'
import HtmlGlassCard from '../html-glass-card/HtmlGlassCard'
import { TransmissionGallery } from '../transmission/GlassCards'
import { GlassObjectGallery } from '../glass-objects/GlassObjectCards'
import styles from './GlassPanelExample.module.css'

/** Optional example. It is deliberately not mounted in the application. */
export default function GlassPanelExample() {
  const { isMounted, toggle } = useGlassPanelMount()
  const [expanded, setExpanded] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  return (
    <main className={styles.example}>
      <div className={styles.toolbar}>
        <button type="button" onClick={toggle} aria-pressed={isMounted}>
          {isMounted ? 'Unmount 3D glass' : 'Mount 3D glass'}
        </button>
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
          {expanded ? 'Less content' : 'More content'}
        </button>
      </div>

      <GlassPanel3D mounted={isMounted} aria-labelledby="glass-panel-title" contentClassName={styles.content}>
        <p className={styles.eyebrow}>FIRST LIGHT / REUSABLE COMPONENT</p>
        <h1 id="glass-panel-title">A little more depth.</h1>
        <p>Your content stays in HTML. A separate Three.js layer gives this panel its glass surface.</p>
        {expanded && <p>The panel grows with its children. Turning off the 3D layer keeps this text and your draft in place, with the shared CSS glass styling underneath.</p>}
        <label className={styles.field}>
          Research draft
          <input name="draft" placeholder="Keep an idea here…" />
        </label>
      </GlassPanel3D>

      <section className={styles.sceneExample}>
        <div className={styles.toolbar}>
          <p className={styles.eyebrow}>HTML INSIDE THE SCENE</p>
          <button type="button" aria-pressed={previewError} onClick={() => setPreviewError(value => !value)}>
            {previewError ? 'Hide input error' : 'Preview input error'}
          </button>
        </div>
        <HtmlGlassCard error={previewError} />
      </section>
      <GlassObjectGallery />
      <TransmissionGallery />
    </main>
  )
}
