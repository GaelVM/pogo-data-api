import { describe, expect, it } from 'vitest'
import { ivRankingsForForm } from '../src/static/iv-rankings.js'

const bulbasaur = { attack: 118, defense: 111, stamina: 128 } as never

describe('IV rankings', () => {
  it('ordena las combinaciones y respeta el límite de Liga Super', () => {
    const rankings = ivRankingsForForm(bulbasaur, 'great', 25)
    expect(rankings).toHaveLength(25)
    expect(rankings[0]?.rank).toBe(1)
    expect(rankings[0]?.percentage).toBe(100)
    expect(rankings.every((entry) => entry.cp <= 1500)).toBe(true)
  })

  it('prefiere 15/15/15 en Liga Master', () => {
    expect(ivRankingsForForm(bulbasaur, 'master', 1)[0]?.ivs).toEqual({ attack: 15, defense: 15, stamina: 15 })
  })
})
