import { describe, expect, it } from 'vitest'
import { attackMultiplier, defensiveMatchups } from '../src/static/type-effectiveness.js'

const types = [
  { id: 5, slug: 'ground', name: 'Ground' }, { id: 9, slug: 'steel', name: 'Steel' },
  { id: 10, slug: 'fire', name: 'Fire' }, { id: 11, slug: 'water', name: 'Water' },
  { id: 12, slug: 'grass', name: 'Grass' }, { id: 13, slug: 'electric', name: 'Electric' },
]

describe('type effectiveness', () => {
  it('calcula daño super eficaz, resistido e inmunidades adaptadas a GO', () => {
    expect(attackMultiplier('water', ['fire'])).toBe(1.6)
    expect(attackMultiplier('fire', ['water'])).toBe(0.625)
    expect(attackMultiplier('electric', ['ground'])).toBe(0.390625)
  })

  it('combina multiplicadores para Pokémon de dos tipos', () => {
    const matchups = defensiveMatchups([5, 11], types)
    expect(matchups.weaknesses.find((entry) => entry.slug === 'grass')?.multiplier).toBeCloseTo(2.56)
    expect(matchups.resistances.find((entry) => entry.slug === 'fire')?.multiplier).toBe(0.625)
  })
})
