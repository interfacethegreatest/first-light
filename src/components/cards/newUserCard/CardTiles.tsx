import styles from './cardTiles.module.css'

const tileNames = [
  'tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'tile6', 'tile7',
  'tile9', 'tile10', 'tile12', 'tile13', 'tile15',
] as const

const loaderNames = [
  'loader', 'loader2', 'loader3', 'loader4', 'loader5', 'loader6',
] as const

export default function CardTiles({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div
      className={styles.viewport}
      data-card-tiles
      data-reduced-motion={reducedMotion}
      aria-hidden="true"
    >
      <div className={styles.pattern} data-tile-pattern>
        {tileNames.map(name => (
          <div key={name} className={`${styles.tile} ${styles[name]}`} />
        ))}
        {loaderNames.map(name => (
          <div key={name} className={`${styles.loaderLine} ${styles[name]}`} />
        ))}
      </div>
    </div>
  )
}
