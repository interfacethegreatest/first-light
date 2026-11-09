import type { ReactElement } from 'react'
import MoonMark, { type MoonMarkProps } from './MoonMark'

// A reusable scene object; the caller owns navigation. No separate icon layer.
export const moonMarkTemplate = {
  render: (props: MoonMarkProps = {}): ReactElement => <MoonMark {...props} />,
}
