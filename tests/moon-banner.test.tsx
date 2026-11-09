import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MoonBanner from '../src/components/header/MoonBanner'

afterEach(() => { vi.unstubAllGlobals() })

it('keeps the full-width home link and export action as separate keyboard controls', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(),
  })))
  vi.stubGlobal('WebGLRenderingContext', undefined)
  vi.stubGlobal('WebGL2RenderingContext', undefined)
  const onExport = vi.fn()
  const user = userEvent.setup()
  render(<MoonBanner onExport={onExport} />)

  const home = screen.getByRole('link', { name: 'First Light home' })
  const exportButton = screen.getByRole('button', { name: 'Export workspace' })
  expect(home).toHaveAttribute('href', '#top')
  expect(home.querySelectorAll('[data-moon-mark]')).toHaveLength(1)
  expect(home.querySelector('svg')).not.toBeInTheDocument()
  expect(within(home).queryByRole('button')).not.toBeInTheDocument()
  expect(home).not.toContainElement(exportButton)

  await user.tab()
  expect(home).toHaveFocus()
  await user.tab()
  expect(exportButton).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(onExport).toHaveBeenCalledOnce()
})
