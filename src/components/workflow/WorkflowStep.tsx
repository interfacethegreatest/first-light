import useScrollToSection from './useScrollToSection'
import styles from './WorkflowStep.module.css'

interface WorkflowStepProps {
  step: string
  label: string
  targetId: string
  beforeNavigate?: () => void
}

export default function WorkflowStep({ step, label, targetId, beforeNavigate }: WorkflowStepProps) {
  const navigate = useScrollToSection(targetId, beforeNavigate)

  return (
    <span>
      <button type="button" className={styles.button} aria-controls={targetId} onClick={navigate}>
        <b>{step}</b> {label}
      </button>
    </span>
  )
}
