import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import GlassTextScene from '../../src/components/glass-objects/GlassTextScene'

function Example() {
  const [text, setText] = useState('LIGHT')
  const [spin, setSpin] = useState(false)
  const [editing, setEditing] = useState(false)
  return (
    <main style={{ maxWidth: 1000, margin: 'auto', padding: '24px', boxSizing: 'border-box' }}>
      <h1>Standalone glass typography</h1>
      <p>The exact torus/panel material, applied to bold extruded text.</p>
      <GlassTextScene text={text || 'LIGHT'} spin={spin && !editing} />
      <div onFocusCapture={() => setEditing(true)} onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEditing(false)
      }}>
        <label>Text <input value={text} maxLength={20} onChange={event => setText(event.currentTarget.value)} /></label>
        <label style={{ marginLeft: 16 }}><input type="checkbox" checked={spin} onChange={event => setSpin(event.currentTarget.checked)} /> Spin</label>
      </div>
      <p>No image, gradient or plate is painted into the displayed canvas.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Example /></StrictMode>)
