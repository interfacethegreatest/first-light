import HeaderExport from './HeaderExport'
import EarthMark from '../misc/EarthMark/EarthMark'
import { headerFrameTemplate } from './headerFrameTemplate'
import { headerTitleTemplate } from './headerTitleTemplate'
import styles from './MoonBanner.module.css'

export interface MoonBannerProps {
  onExport: () => void
}

export default function MoonBanner({ onExport }: MoonBannerProps) {
  return headerFrameTemplate.render({
    as: 'header',
    className: `site-header ${styles.banner}`,
    children: (
      <>
        <a className={`brand ${styles.home}`} href="#top" aria-label="First Light home">
          {headerTitleTemplate.render()}
          <div className={`header-context ${styles.context}`}>
            <span>Research workspace</span>
            <span className={styles.localBadge}><EarthMark size={12} />Local</span>
          </div>
        </a>
        <HeaderExport onExport={onExport} />
      </>
    ),
  })
}
