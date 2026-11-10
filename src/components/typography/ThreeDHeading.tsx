import type { ReactNode } from 'react'
import FooterTextScene from './FooterTextScene'
import styles from './ThreeDHeading.module.css'

export interface ThreeDHeadingProps {
  title?: string
  children?: ReactNode
  id?: string
  level?: 'h1' | 'h2' | 'h3'
}

export default function ThreeDHeading({
  title = 'Default Title',
  children,
  id,
  level: Heading = 'h2',
}: ThreeDHeadingProps) {
  return (
    <div className={styles.container} data-three-d-heading>
      <Heading id={id} className={styles.heading}>{title}</Heading>
      <div className={styles.visual} aria-hidden="true">
        <FooterTextScene text={title} motion={false} className={styles.scene} />
      </div>
      {children}
    </div>
  )
}
