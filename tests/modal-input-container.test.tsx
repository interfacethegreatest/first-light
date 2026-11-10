import { StrictMode, createRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalInputContainer from '../src/components/input/ModalInput/ModalInputContainer'

function container() { return screen.getByTestId('input-container') }

describe('Calendar4 modal input container', () => {
  it('starts idle, activates with keyboard focus, and chooses error only after activation', async () => {
    const user = userEvent.setup()
    const view = render(<ModalInputContainer data-testid="input-container" error><label>Evidence<input /></label></ModalInputContainer>)
    const input = screen.getByRole('textbox', { name: 'Evidence' })
    expect(container()).toHaveAttribute('data-modal-input-state', 'idle')
    await user.tab()
    expect(input).toHaveFocus()
    expect(container()).toHaveAttribute('data-modal-input-state', 'error')
    view.rerender(<ModalInputContainer data-testid="input-container"><label>Evidence<input /></label></ModalInputContainer>)
    expect(container()).toHaveAttribute('data-modal-input-state', 'active')
    expect(screen.getByRole('textbox', { name: 'Evidence' })).toBe(input)
    expect(input).toHaveFocus()
  })

  it('resets outside only while blank, reads the latest controlled text, and accepts touch outside', async () => {
    function Example() {
      const [value, setValue] = useState('')
      return <><ModalInputContainer data-testid="input-container" text={value}><label>Note<input value={value} onChange={event => setValue(event.target.value)} /></label></ModalInputContainer><button>Outside</button></>
    }
    const user = userEvent.setup()
    render(<Example />)
    const input = screen.getByRole('textbox', { name: 'Note' })
    await user.click(input)
    expect(container()).toHaveAttribute('data-modal-input-state', 'active')
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(container()).toHaveAttribute('data-modal-input-state', 'idle')
    await user.type(input, 'A finding')
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(container()).toHaveAttribute('data-modal-input-state', 'active')
    expect(input).toHaveValue('A finding')
    await user.clear(input)
    await user.type(input, '  ')
    fireEvent.touchStart(screen.getByRole('button', { name: 'Outside' }))
    expect(container()).toHaveAttribute('data-modal-input-state', 'idle')
  })

  it('uses truthy custom height without replacing its children or unrelated native div props', () => {
    const child = <label>Research<textarea defaultValue="Keep the node" /></label>
    const view = render(<ModalInputContainer data-testid="input-container" height={0} className="caller-class" style={{ paddingRight: 12 }}>{child}</ModalInputContainer>)
    const input = screen.getByRole('textbox', { name: 'Research' })
    expect(container().style.height).toBe('')
    view.rerender(<ModalInputContainer data-testid="input-container" height={120} className="caller-class" style={{ paddingRight: 12 }}>{child}</ModalInputContainer>)
    expect(container()).toHaveStyle({ height: '120px', paddingRight: '12px' })
    expect(container()).toHaveClass('caller-class')
    expect(screen.getByRole('textbox', { name: 'Research' })).toBe(input)
    view.rerender(<ModalInputContainer data-testid="input-container" height={null}>{child}</ModalInputContainer>)
    expect(container().style.height).toBe('')
    expect(input).toHaveValue('Keep the node')
  })

  it('preserves child refs, native change/focus/click events and keyboard form submission', async () => {
    const inputRef = createRef<HTMLInputElement>()
    const change = vi.fn(), clicked = vi.fn(), focused = vi.fn(), submit = vi.fn()
    const user = userEvent.setup()
    render(<form onSubmit={event => { event.preventDefault(); submit() }}><ModalInputContainer data-testid="input-container" onClick={clicked} onFocusCapture={focused}><label>Native field<input ref={inputRef} onChange={change} required /></label></ModalInputContainer><button type="submit">Submit finding</button></form>)
    const input = screen.getByRole('textbox', { name: 'Native field' })
    await user.click(input)
    await user.keyboard('A')
    expect(inputRef.current).toBe(input)
    expect(inputRef.current!.value).toBe('A')
    expect(change).toHaveBeenCalledOnce()
    expect(clicked).toHaveBeenCalledOnce()
    expect(focused).toHaveBeenCalledOnce()
    await user.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledOnce()
  })

  it('cleans outside subscriptions on text changes and final StrictMode unmount', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const view = render(<StrictMode><ModalInputContainer text=""><input aria-label="Note" /></ModalInputContainer></StrictMode>)
    view.rerender(<StrictMode><ModalInputContainer text="Updated"><input aria-label="Note" /></ModalInputContainer></StrictMode>)
    view.unmount()
    const subscriptions = add.mock.calls.filter(([name]) => name === 'mousedown' || name === 'touchstart')
    expect(subscriptions.length).toBeGreaterThan(0)
    for (const [name, listener] of subscriptions) {
      expect(remove.mock.calls.some(([removedName, removedListener]) => removedName === name && removedListener === listener)).toBe(true)
    }
  })
})
