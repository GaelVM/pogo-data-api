import { describe, expect, it } from 'vitest'
import { calculateCp, CP_MULTIPLIERS, formCombat } from '../src/static/combat.js'

describe('combat calculations', () => {
  it('calcula el CP de un Bulbasaur perfecto en niveles 40 y 50', () => {
    const stats = { attack: 118, defense: 111, stamina: 128 }
    const perfect = { attack: 15, defense: 15, stamina: 15 }
    expect(calculateCp(stats, perfect, CP_MULTIPLIERS[40])).toBe(1115)
    expect(calculateCp(stats, perfect, CP_MULTIPLIERS[50])).toBe(1260)
  })

  it('no calcula combate cuando faltan estadísticas', () => {
    expect(formCombat({ attack: undefined } as never)).toBeUndefined()
  })
})
