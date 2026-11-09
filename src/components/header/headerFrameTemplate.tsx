import type { ReactElement } from 'react'
import HeaderFrame, { type HeaderFrameProps } from './HeaderFrame'

export const headerFrameTemplate = {
  render: (props: HeaderFrameProps = {}): ReactElement => <HeaderFrame {...props} />,
}
