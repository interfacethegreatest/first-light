import CalendarButton from '../calendarMotion/CalendarButton'

interface AddSourceButtonProps {
  onClick: () => void
  sectionsId?: string
}

export default function AddSourceButton({
  onClick,
  sectionsId = 'source-sections',
}: AddSourceButtonProps) {
  return (
    <CalendarButton
      className="button button-primary"
      type="button"
      label="Add source"
      hoverLabel="New section"
      onClick={onClick}
      aria-controls={sectionsId}
      icon={<span aria-hidden="true">+</span>}
    />
  )
}
