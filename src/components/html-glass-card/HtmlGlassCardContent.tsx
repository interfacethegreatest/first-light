import { useLayoutEffect, useRef } from 'react'
import ModalInputContainer from '../input/ModalInput/ModalInputContainer'
import '../../styles/glass.css'
import styles from './HtmlGlassCard.module.css'

export interface HtmlGlassCardContentProps {
  fieldId: string
  value: string
  error: boolean
  inputHeight: number | null
  onValueChange: (value: string) => void
  onFocusWithinChange: (focused: boolean) => void
  onSize: (width: number, height: number) => void
}

export default function HtmlGlassCardContent({
  fieldId, value, error, inputHeight, onValueChange, onFocusWithinChange, onSize,
}: HtmlGlassCardContentProps) {
  const element = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const node = element.current
    if (!node) return
    const measure = () => onSize(node.offsetWidth, node.offsetHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [onSize])

  return (
    <div
      ref={element}
      className={styles.card}
      data-html-glass-content=""
      role="group"
      aria-labelledby={`${fieldId}-title`}
      onFocusCapture={() => onFocusWithinChange(true)}
      onBlurCapture={event => {
        if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) onFocusWithinChange(false)
      }}
    >
      <p className={styles.eyebrow}>HTML / THREE.JS</p>
      <h2 id={`${fieldId}-title`}>Hello from 3D.</h2>
      <p>This is real HTML inside the scene. The glass and torus are Three.js objects.</p>
      <label htmlFor={fieldId}>Scene research note</label>
      <ModalInputContainer text={value} error={error} height={inputHeight}>
        <textarea
          id={fieldId}
          className={styles.note}
          value={value}
          onChange={event => onValueChange(event.target.value)}
          aria-invalid={error}
          aria-describedby={`${fieldId}-hint`}
          placeholder="An idea worth exploring…"
        />
      </ModalInputContainer>
      <p className={styles.hint} id={`${fieldId}-hint`}>
        {error ? 'Preview error: review this note.' : 'Click or focus the field to see the Calendar4 highlight.'}
      </p>
    </div>
  )
}
