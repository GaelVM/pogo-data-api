import type { LiveEvent } from './live.js'

export interface DataDuckEvent {
  eventID: string
  name: string
  eventType: string
  heading?: string
  link?: string
  image?: string
  start: string
  end: string
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
  return events.map((event) => ({
    id: event.eventID,
    name: event.name,
    eventType: event.eventType,
    startsAt: zonedDate(event.start, utcOffset),
    endsAt: zonedDate(event.end, utcOffset),
    description: event.heading,
    sourceUrl: event.link,
    imageUrl: event.image,
    extraData: event.extraData,
  }))
}

