import type { HTMLAttributes } from 'react'
import styles from './TileGrid.module.css'

// Layout belongs to the caller; both hero and source cards share this paint.
export default function TileGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`${styles.grid}${className ? ` ${className}` : ''}`}
      data-tile-grid
      aria-hidden="true"
    />
  )
}
