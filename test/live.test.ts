import { describe, expect, it } from 'vitest'
import { liveEndpoints, validateLiveData } from '../src/static/live.js'

describe('live data', () => {
  it('clasifica eventos según el momento de generación', () => {
    const live = liveEndpoints(validateLiveData({ timezone: 'America/Lima', raids: [], events: [
      { id: 'past', name: 'Pasado', eventType: 'test', startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-01-02T00:00:00Z' },
      { id: 'active', name: 'Activo', eventType: 'test', startsAt: '2026-01-02T00:00:00Z', endsAt: '2026-01-04T00:00:00Z' },
      { id: 'next', name: 'Próximo', eventType: 'test', startsAt: '2026-01-05T00:00:00Z', endsAt: '2026-01-06T00:00:00Z' },
    ] }), new Date('2026-01-03T00:00:00Z'))
    expect(live.activeEvents.map((event) => event.id)).toEqual(['active'])
    expect(live.upcomingEvents.map((event) => event.id)).toEqual(['next'])
    expect(live.pastEvents.map((event) => event.id)).toEqual(['past'])
  })

  it('rechaza identificadores duplicados', () => {
    const event = { id: 'same', name: 'Evento', eventType: 'test', startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-01-02T00:00:00Z' }
    expect(() => validateLiveData({ timezone: 'UTC', events: [event, event], raids: [] })).toThrow('duplicado')
  })
})
