import { describe, expect, it } from 'vitest'
import { calculateCp, CP_MULTIPLIERS, formCombat, pvpRankings } from '../src/static/combat.js'
import { normalizeMasterfile } from '../src/importer/normalize.js'
import type { Masterfile } from '../src/importer/types.js'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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

  it('genera las tres ligas y respeta sus límites de CP', async () => {
    const fixture = JSON.parse(await readFile(resolve('data/sample/game-master.sample.json'), 'utf8')) as Masterfile
    const rankings = pvpRankings(normalizeMasterfile(fixture))
    expect(Object.keys(rankings.leagues)).toEqual(['great', 'ultra', 'master'])
    expect(rankings.leagues.great.rankings.every((entry) => entry.cp <= 1500)).toBe(true)
    expect(rankings.leagues.ultra.rankings.every((entry) => entry.cp <= 2500)).toBe(true)
  })
})
