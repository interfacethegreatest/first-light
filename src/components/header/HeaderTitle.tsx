import { moonMarkTemplate } from '../misc/MoonMark/moonMarkTemplate'
import HeaderFrame from './HeaderFrame'
import styles from './HeaderTitle.module.css'

export interface HeaderTitleProps {
  className?: string
}

export default function HeaderTitle({ className }: HeaderTitleProps) {
  return (
    <HeaderFrame as="div" data-header-title className={`${styles.title}${className ? ` ${className}` : ''}`}>
      {moonMarkTemplate.render({ size: 112, animate: true, rotationAxis: 'y', rotationSpeed: -0.12, className: styles.scene })}
      <span className={styles.wordmark}>first light<span className={`brand-dot ${styles.dot}`}>.</span></span>
    </HeaderFrame>
  )
}
