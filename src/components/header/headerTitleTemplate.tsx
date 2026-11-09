import type { ReactElement } from 'react'
import HeaderTitle, { type HeaderTitleProps } from './HeaderTitle'

// A fitted visual object; the caller owns navigation and workspace metadata.
export const headerTitleTemplate = {
  render: (props: HeaderTitleProps = {}): ReactElement => <HeaderTitle {...props} />,
}
