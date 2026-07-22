import { describe, expect, it } from 'vitest'
import { changesDataset, compareCategory } from '../src/static/changes.js'

describe('change detection', () => {
  it('detecta altas, bajas y cambios usando una identidad estable', () => {
    const result = compareCategory('raids', [{ name: 'Solgaleo', tier: '5-Star', shiny: true }, { name: 'Pikachu', tier: '1-Star' }], [{ name: 'Solgaleo', tier: '5-Star', shiny: false }, { name: 'Kyogre', tier: '5-Star' }])
    expect(result.counts).toEqual({ added: 1, removed: 1, updated: 1 })
  })

  it('indica cuando todavía no existe snapshot anterior', () => {
    const current = { events: [], raids: [], eggs: [], research: [], rocket: [] }
    expect(changesDataset(current, {}).hasPreviousSnapshot).toBe(false)
  })
})
