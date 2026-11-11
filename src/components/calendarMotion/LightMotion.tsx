import { domAnimation, LazyMotion, m, type HTMLMotionProps } from 'framer-motion'

// These reusable elements need variants/gestures, not Framer's drag/layout
// projection engine. Each supplies its own features so standalone card/button
// consumers keep working without an application-specific provider or DOM layer.
function MotionDiv(props: HTMLMotionProps<'div'>) {
  return <LazyMotion features={domAnimation} strict><m.div {...props} /></LazyMotion>
}

function MotionButton(props: HTMLMotionProps<'button'>) {
  return <LazyMotion features={domAnimation} strict><m.button {...props} /></LazyMotion>
}

export const motion = { div: MotionDiv, button: MotionButton }
