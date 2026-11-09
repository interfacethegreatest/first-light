import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// A failed decorative chunk must not prevent the research workspace from loading.
const StarBackground = lazy(() =>
  import('./components/backgrounds/starsBackground/StarBackground').catch(() => ({
    default: () => <></>,
  })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <StarBackground />
    </Suspense>
    <div className="app-content">
      <App />
    </div>
  </StrictMode>,
)
