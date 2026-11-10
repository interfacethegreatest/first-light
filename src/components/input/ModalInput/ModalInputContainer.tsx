import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type FocusEvent, type MouseEvent as ReactMouseEvent } from 'react'
import useOutsideClick from '../outsideClick'
import style from './ModalInputContainer.module.css'

export interface ModalInputContainerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'id'> {
  text?: string
  error?: boolean
  height?: number | null
}

// Calendar4 ModalInput.tsx, blob a8c5104262ef6cd1c8ae772ee38247a2c4a1bd18:
// retain its container IDs/clicked state, without the original auth/input logic.
export default function ModalInputContainer({
  children,
  text = '',
  error = false,
  height,
  onClick,
  onFocusCapture,
  style: nativeStyle,
  ...nativeDivProps
}: ModalInputContainerProps) {
  const [clicked, setClicked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unclickContent = useCallback(() => {
    if (text.trim() === '') setClicked(false)
  }, [text])
  useOutsideClick(ref, unclickContent)

  const handleClickedContent = (event: ReactMouseEvent<HTMLDivElement>) => {
    setClicked(true)
    onClick?.(event)
  }
  const handleFocusedContent = (event: FocusEvent<HTMLDivElement>) => {
    setClicked(true)
    onFocusCapture?.(event)
  }

  return (
    <div
      {...nativeDivProps}
      onClick={handleClickedContent}
      onFocusCapture={handleFocusedContent}
      id={clicked ? error ?
        style.glowingInputContainerError
        :
        style.glowingInputContainer
        : style.inputContainer}
      ref={ref}
      data-modal-input-state={clicked ? error ? 'error' : 'active' : 'idle'}
      style={{
        ...nativeStyle,
        height: height ? `${height}px` : undefined,
      }}
    >
      {children}
    </div>
  )
}
