import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeMasterfile } from '../src/importer/normalize.js'
import type { Masterfile } from '../src/importer/types.js'

async function sample() {
  const raw = await readFile(resolve('data/sample/game-master.sample.json'), 'utf8')
  return JSON.parse(raw) as Masterfile
}

describe('normalizeMasterfile', () => {
  it('normaliza especies, formas, tipos y movimientos', async () => {
    const result = normalizeMasterfile(await sample())

    expect(result.pokemon).toHaveLength(2)
    expect(result.forms).toHaveLength(2)
    expect(result.types).toHaveLength(2)
    expect(result.moves.find((move) => move.id === 214)).toMatchObject({
      category: 'FAST',
      typeId: 12,
      name: 'Vine Whip',
    })
  })

  it('conserva evoluciones y estadísticas de la forma', async () => {
    const result = normalizeMasterfile(await sample())
    const bulbasaur = result.forms.find((form) => form.pokemonId === 1)

    expect(bulbasaur).toMatchObject({
      formId: 163,
      isDefault: true,
      attack: 118,
      defense: 111,
      stamina: 128,
      typeIds: [4, 12],
    })
    expect(bulbasaur?.evolutions[0]).toMatchObject({ pokemon: 2, candyCost: 25 })
  })
})
