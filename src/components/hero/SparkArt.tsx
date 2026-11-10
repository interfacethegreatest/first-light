import TileGrid from '../decorations/TileGrid'
import styles from './SparkArt.module.css'

export default function SparkArt() {
  return (
    <div className={styles.art} aria-hidden="true" data-spark-art>
      <TileGrid className={styles.grid} />
      <svg aria-hidden="true" className={styles.sun} width="180" height="122" viewBox="0 0 180 122" fill="none">
        <path d="M20 102h140M33 113h114M90 9v17M30 35l12 12M150 35l-12 12M10 76h18M152 76h18" stroke="currentColor" strokeWidth="2" />
        <path d="M43 102a47 47 0 0 1 94 0" fill="currentColor" />
      </svg>
      <span className={styles.caption}>EVERY BUILD STARTS WITH A SPARK</span>
    </div>
  )
}
