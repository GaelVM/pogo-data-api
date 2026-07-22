export interface LiveEvent {
  id: string
  name: string
  eventType: string
  startsAt: string
  endsAt: string
  description?: string
  bonuses?: string[]
  featuredPokemonIds?: number[]
  sourceUrl?: string
}

export interface RaidBoss {
  id: string
  pokemonId: number
  name: string
  tier: string
  startsAt: string
  endsAt: string
  shinyAvailable?: boolean
  mega?: boolean
  shadow?: boolean
  sourceUrl?: string
}

export interface LiveData {
  timezone: string
  events: LiveEvent[]
  raids: RaidBoss[]
}

export const EMPTY_LIVE_DATA: LiveData = { timezone: 'America/Lima', events: [], raids: [] }

function validDate(value: string) {
  return Number.isFinite(Date.parse(value))
}

export function validateLiveData(input: LiveData) {
  const ids = new Set<string>()
  for (const entry of [...input.events, ...input.raids]) {
    if (!entry.id || ids.has(entry.id)) throw new Error(`ID dinámico vacío o duplicado: ${entry.id}`)
    ids.add(entry.id)
    if (!validDate(entry.startsAt) || !validDate(entry.endsAt) || Date.parse(entry.startsAt) >= Date.parse(entry.endsAt)) {
      throw new Error(`Fechas inválidas para ${entry.id}`)
    }
  }
  return input
}

export function liveEndpoints(input: LiveData, now = new Date()) {
  const generatedAt = now.toISOString()
  const enrich = <T extends LiveEvent | RaidBoss>(entry: T) => {
    const current = now.getTime()
    const start = Date.parse(entry.startsAt)
    const end = Date.parse(entry.endsAt)
    const status = current < start ? 'upcoming' : current >= end ? 'past' : 'active'
    return { ...entry, status }
  }
  const events = input.events.map(enrich).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const raids = input.raids.map(enrich).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  return {
    manifest: { generatedAt, timezone: input.timezone, counts: { events: events.length, raids: raids.length, activeEvents: events.filter((entry) => entry.status === 'active').length, activeRaids: raids.filter((entry) => entry.status === 'active').length } },
    events,
    activeEvents: events.filter((entry) => entry.status === 'active'),
    upcomingEvents: events.filter((entry) => entry.status === 'upcoming'),
    pastEvents: events.filter((entry) => entry.status === 'past'),
    raids,
    activeRaids: raids.filter((entry) => entry.status === 'active'),
    upcomingRaids: raids.filter((entry) => entry.status === 'upcoming'),
    calendar: [...events.map((entry) => ({ kind: 'event', ...entry })), ...raids.map((entry) => ({ kind: 'raid', ...entry }))].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
  }
}

