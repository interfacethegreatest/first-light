import type { ReactElement } from 'react'
import MoonMark, { type MoonMarkProps } from './MoonMark'

// A reusable visual object; the caller retains its existing link or button.
export const moonMarkTemplate = {
  render: (props: MoonMarkProps = {}): ReactElement => <MoonMark {...props} />,
}
