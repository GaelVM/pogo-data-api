import type { LiveEvent } from './live.js'

export interface DataDuckEvent {
  eventID: string
  name: string
  eventType: string
  heading?: string
  link?: string
  image?: string
  start: string | null
  end: string | null
  extraData?: unknown
}

export interface DataDuckSnapshot {
  meta: Record<string, unknown>
  events: DataDuckEvent[]
  raids: unknown[]
  eggs: unknown[]
  research: unknown[]
  rocket: unknown[]
}

function zonedDate(value: string, utcOffset = '-05:00') {
  return /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}${utcOffset}`
}

export function dataDuckEvents(events: DataDuckEvent[], utcOffset = '-05:00'): LiveEvent[] {
  return events.flatMap((event) => {
    if (typeof event.start !== 'string' || typeof event.end !== 'string') return []

    const startsAt = zonedDate(event.start, utcOffset)
    const endsAt = zonedDate(event.end, utcOffset)
    const start = Date.parse(startsAt)
    const end = Date.parse(endsAt)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return []

    return [{
      id: event.eventID,
      name: event.name,
      eventType: event.eventType,
      startsAt,
      endsAt,
      description: event.heading,
      sourceUrl: event.link,
      imageUrl: event.image,
      extraData: event.extraData,
    }]
  })
}
