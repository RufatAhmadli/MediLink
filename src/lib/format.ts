import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from 'date-fns'

export const fmtDate = (iso: string) => format(new Date(iso), 'd MMM yyyy')
export const fmtShortDate = (iso: string) => format(new Date(iso), 'd MMM')
export const fmtTime = (iso: string) => format(new Date(iso), 'HH:mm')
export const fmtDateTime = (iso: string) => format(new Date(iso), 'd MMM yyyy, HH:mm')
export const fmtWeekday = (iso: string) => format(new Date(iso), 'EEE d MMM')

export function fmtRelativeDay(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE d MMM')
}

export const fmtAgo = (iso: string) => `${formatDistanceToNowStrict(new Date(iso))} ago`

export const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
