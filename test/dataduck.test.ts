import { describe, expect, it } from 'vitest'
import { dataDuckEvents } from '../src/static/dataduck.js'

describe('DataDuck adapter', () => {
  it('normaliza eventos locales y conserva enlaces', () => {
    const [event] = dataDuckEvents([{ eventID: 'raid-hour', name: 'Raid Hour', eventType: 'raid-hour', start: '2026-07-22T18:00:00.000', end: '2026-07-22T19:00:00.000', link: 'https://example.com' }])
    expect(event).toMatchObject({ id: 'raid-hour', startsAt: '2026-07-22T18:00:00.000-05:00', sourceUrl: 'https://example.com' })
  })

  it('no modifica fechas que ya tienen zona horaria', () => {
    const [event] = dataDuckEvents([{ eventID: 'gbl', name: 'GBL', eventType: 'gbl', start: '2026-07-22T20:00:00.000Z', end: '2026-07-23T20:00:00.000Z' }])
    expect(event.startsAt).toBe('2026-07-22T20:00:00.000Z')
  })
})
