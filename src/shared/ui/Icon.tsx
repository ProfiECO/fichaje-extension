import type { ReactNode } from 'react'
export type IconName =
  | 'clock'
  | 'refresh'
  | 'settings'
  | 'arrow'
  | 'left'
  | 'right'
  | 'download'
  | 'external'
  | 'eye'
  | 'eyeOff'
  | 'check'
  | 'calendar'

export default function Icon({
  name,
  size = 18
}: {
  name: IconName
  size?: number
}) {
  const paths: Record<IconName, ReactNode> = {
    eye: (
      <>
        <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z' />
        <circle cx='12' cy='12' r='3' />
      </>
    ),
    eyeOff: (
      <>
        <path d='m3 3 18 18M10 5.2c.6-.1 1.3-.2 2-.2 7 0 10 7 10 7a18 18 0 0 1-3 3.7M6.2 6.2A19 19 0 0 0 2 12s3 7 10 7a11 11 0 0 0 5.8-1.8' />
      </>
    ),
    check: <path d='m5 12 4 4L19 6' />,
    calendar: (
      <>
        <rect x='3' y='5' width='18' height='16' rx='3' />
        <path d='M7 3v4m10-4v4M3 11h18' />
      </>
    ),
    clock: (
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M12 7v5l3 2' />
      </>
    ),
    refresh: (
      <>
        <path d='M20 7v5h-5M4 17v-5h5' />
        <path d='M6.2 7a7 7 0 0 1 11.6-1L20 9M4 15l2.2 3A7 7 0 0 0 17.8 17' />
      </>
    ),
    settings: (
      <>
        <path d='M4 7h16M4 17h16' />
        <circle cx='9' cy='7' r='3' />
        <circle cx='15' cy='17' r='3' />
      </>
    ),
    arrow: (
      <>
        <path d='M5 12h14m-5-5 5 5-5 5' />
      </>
    ),
    left: <path d='m14 6-6 6 6 6' />,
    right: <path d='m10 6 6 6-6 6' />,
    download: (
      <>
        <path d='M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5' />
      </>
    ),
    external: (
      <>
        <path d='M14 3h7v7m0-7L10 14M10 3H3v18h18v-7' />
      </>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {paths[name]}
    </svg>
  )
}
