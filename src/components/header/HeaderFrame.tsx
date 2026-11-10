import type { HTMLAttributes } from 'react'
import PaneBackground from '../panes/PaneBackground'
import styles from './HeaderFrame.module.css'

export interface HeaderFrameProps extends HTMLAttributes<HTMLElement> {
  as?: 'header' | 'div'
}

export default function HeaderFrame({ as: Element = 'div', className, ...props }: HeaderFrameProps) {
  return (
    <PaneBackground
      as={Element}
      {...props}
      data-header-frame
      className={`${styles.frame}${className ? ` ${className}` : ''}`}
    />
  )
}
