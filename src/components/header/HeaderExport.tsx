import CalendarButton from '../calendarMotion/CalendarButton'
import styles from './HeaderExport.module.css'

export interface HeaderExportProps {
  onExport: () => void
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />
    </svg>
  )
}

export default function HeaderExport({ onExport }: HeaderExportProps) {
  return (
    <div data-header-export className={styles.wrapper}>
      <CalendarButton
        className={`button button-secondary export-button ${styles.button}`}
        type="button"
        label="Export workspace"
        hoverLabel="Download JSON"
        title="Export workspace"
        onClick={onExport}
        icon={<DownloadIcon />}
      />
      <span className={styles.mobileIcon} aria-hidden="true"><DownloadIcon /></span>
    </div>
  )
}
