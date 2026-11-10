import { createElement, type ComponentPropsWithRef, type ReactElement } from 'react'
import '../../styles/glass.css'
import styles from './PaneBackground.module.css'

export type PaneBackgroundElement = 'div' | 'section' | 'aside' | 'li' | 'header' | 'input' | 'textarea' | 'select'

export type PaneBackgroundProps<Element extends PaneBackgroundElement = 'div'> = {
  as?: Element
} & Omit<ComponentPropsWithRef<NoInfer<Element>>, 'as'>

export const paneBackgroundClassName = styles.background

export default function PaneBackground<Element extends PaneBackgroundElement = 'div'>({
  as,
  className,
  ...props
}: PaneBackgroundProps<Element>): ReactElement {
  const classes = `${paneBackgroundClassName}${className ? ` ${className}` : ''}`.trim().split(/\s+/)

  return createElement(as ?? 'div', {
    ...props,
    className: [...new Set(classes)].join(' '),
  })
}
