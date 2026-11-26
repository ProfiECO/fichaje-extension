export default function Meter({
  value,
  goal,
  label
}: {
  value: number
  goal: number
  label: string
}) {
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((value / goal) * 100))
  )
  return (
    <div
      className='h-1.5 overflow-hidden rounded-full bg-line'
      role='progressbar'
      aria-label={label}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className='block h-full rounded-full bg-accent transition-[width]'
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
