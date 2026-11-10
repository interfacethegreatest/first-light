type MovableElement = HTMLElement & { moveBefore: (node: Node, child: Node | null) => void }

/** Reparent the same native controls between Drei Html and their DOM fallback. */
export function moveHtmlHost(host: HTMLDivElement, target: HTMLElement) {
  if (host.parentElement === target) return
  const active = host.contains(document.activeElement) ? document.activeElement as HTMLElement : null
  const field = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active : null
  const selection = field ? [field.selectionStart, field.selectionEnd, field.selectionDirection] as const : null

  // Newer browsers preserve focus/state through a connected DOM move.
  if (host.isConnected && target.isConnected && typeof (target as MovableElement).moveBefore === 'function') {
    (target as MovableElement).moveBefore(host, null)
  } else {
    target.appendChild(host)
  }
  if (active && active.isConnected && document.activeElement !== active) {
    active.focus({ preventScroll: true })
    if (field && selection && selection[0] !== null && selection[1] !== null) {
      field.setSelectionRange(selection[0], selection[1], selection[2] ?? undefined)
    }
  }
}
