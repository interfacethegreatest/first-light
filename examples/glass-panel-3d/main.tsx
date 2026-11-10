import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GlassPanelExample from '../../src/components/glass-panel-3d/GlassPanelExample'
import '../../src/App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><GlassPanelExample /></StrictMode>,
)
