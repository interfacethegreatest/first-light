import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from './SourceSectionMenu.module.css'

interface SourceSectionMenuProps {
  sectionId: string
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss: () => void
}

export default function SourceSectionMenu({ sectionId, label, open, onOpenChange, onDismiss }: SourceSectionMenuProps) {
  const menuId = useId()
  const triggerId = `${menuId}-trigger`
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const firstItem = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) { setPosition(null);return }
    if (!trigger.current || !menu.current) return
    const anchor = trigger.current.getBoundingClientRect()
    const bounds = menu.current.getBoundingClientRect()
    const below = anchor.bottom + 6
    setPosition({
      left: Math.max(8, Math.min(anchor.right - bounds.width, window.innerWidth - bounds.width - 8)),
      top: below + bounds.height <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - bounds.height - 6),
    })
  }, [open])

  useLayoutEffect(() => {
    if (open && position) firstItem.current?.focus({ preventScroll: true })
  }, [open, position])

  useEffect(() => {
    if (!open) return
    const contains = (target: EventTarget | null) => target instanceof Node
      && (trigger.current?.contains(target) || menu.current?.contains(target))
    const outside = (event: Event) => { if (!contains(event.target)) onOpenChange(false) }
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        trigger.current?.focus({ preventScroll: true })
        onOpenChange(false)
      } else if (event.key === 'Tab') {
        trigger.current?.focus({ preventScroll: true })
        onOpenChange(false)
      }
    }
    const close = () => onOpenChange(false)
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', key, true)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', key, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, onOpenChange])

  const focusItem = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      firstItem.current?.focus()
    }
  }

  return (
    <>
      <button
        ref={trigger}
        id={triggerId}
        className={styles.trigger}
        type="button"
        aria-label={`More options for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-source-menu-trigger={sectionId}
        onClick={() => onOpenChange(!open)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            onOpenChange(true)
          }
        }}
      >
        <svg width="20" height="12" viewBox="0 0 24 12" fill="currentColor" aria-hidden="true" focusable="false">
          <circle cx="5" cy="6" r="1.5" /><circle cx="12" cy="6" r="1.5" /><circle cx="19" cy="6" r="1.5" />
        </svg>
      </button>
      {open && createPortal(
        <div ref={menu} id={menuId} role="menu" aria-labelledby={triggerId} className={styles.menu}
          style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
          onKeyDown={focusItem}>
          <button ref={firstItem} type="button" role="menuitem" className={styles.item} onClick={onDismiss}>
            Not interested in this post
          </button>
          <button type="button" role="menuitem" className={styles.blank} disabled tabIndex={-1} aria-hidden="true" />
          <button type="button" role="menuitem" className={styles.blank} disabled tabIndex={-1} aria-hidden="true" />
        </div>,
        document.body,
      )}
    </>
  )
}
