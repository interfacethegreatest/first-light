import HeaderExport from './HeaderExport'
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
            <span className={styles.localBadge}><span aria-hidden="true" />Local</span>
          </div>
        </a>
        <HeaderExport onExport={onExport} />
      </>
    ),
  })
}
