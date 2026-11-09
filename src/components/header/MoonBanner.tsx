import CalendarButton from '../calendarMotion/CalendarButton'
import { moonMarkTemplate } from '../misc/MoonMark/moonMarkTemplate'
import styles from './MoonBanner.module.css'

export interface MoonBannerProps {
  onExport: () => void
}

export default function MoonBanner({ onExport }: MoonBannerProps) {
  return (
    <header className={`site-header ${styles.banner}`}>
      <a className={`brand ${styles.home}`} href="#top" aria-label="First Light home">
        {moonMarkTemplate.render({ size: 112, className: styles.scene })}
        <span className={styles.identity}>
          <span className={styles.wordmark}>first light<span className="brand-dot">.</span></span>
          <span className={`header-context ${styles.context}`}>
            <span>Research workspace</span>
            <span className={styles.localBadge}><span aria-hidden="true" />Local</span>
          </span>
        </span>
      </a>
      <CalendarButton
        className={`button button-secondary export-button ${styles.export}`}
        type="button"
        label="Export workspace"
        hoverLabel="Download JSON"
        onClick={onExport}
        icon={(
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />
          </svg>
        )}
      />
    </header>
  )
}
