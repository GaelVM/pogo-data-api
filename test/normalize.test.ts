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

  it('acepta el formato snake_case producido por pogo-data-generator', () => {
    const result = normalizeMasterfile({
      pokemon: {
        '25': {
          pokedex_id: 25,
          name: 'Pikachu',
          default_form_id: 137,
          gen_id: 1,
          attack: 112,
          defense: 96,
          stamina: 111,
          types: { '13': 'Electric' },
          forms: {
            '137': {
              form_id: 137,
              name: 'Normal',
              types: { '13': 'Electric' },
              elite_quick_moves: { '205': 'Thunder Shock' },
              gmax_move: { move_id: 1000, move_name: 'G-Max Volt Crash' },
              purification_candy: 3,
              purification_dust: 3000,
            },
          },
          temp_evolutions: {
            '1': { temp_evo_id: 1, attack: 200, defense: 180, stamina: 170, types: { '13': 'Electric' }, first_energy_cost: 200 },
          },
        },
      },
      forms: {},
      types: { '13': 'Electric' },
      moves: {
        '205': {
          id: 205,
          name: 'Thunder Shock',
          proto: 'THUNDER_SHOCK_FAST',
          type: 'Electric',
          power: 5,
          duration_ms: 600,
          energy_delta: 8,
          pvp_power: 4,
          pvp_energy_delta: 9,
          pvp_duration_turns: 1,
        },
        '1000': { id: 1000, name: 'G-Max Volt Crash', proto: 'G_MAX_VOLT_CRASH', type: 'Electric', power: 350 },
      },
    } as unknown as Masterfile)

    expect(result.pokemon[0]).toMatchObject({ id: 25, name: 'Pikachu', generation: 1 })
    expect(result.forms[0]).toMatchObject({ formId: 137, attack: 112, typeIds: [13] })
    expect(result.types[0]).toEqual({ id: 13, slug: 'electric', name: 'Electric' })
    expect(result.forms[0]?.moves).toContainEqual({ moveId: 205, availability: 'ELITE' })
    expect(result.forms[0]?.moves).toContainEqual({ moveId: 1000, availability: 'GMAX' })
    expect(result.forms[0]).toMatchObject({ purificationCandy: 3, purificationDust: 3000 })
    expect(result.forms[0]?.temporaryEvolutions[0]).toMatchObject({ id: 1, attack: 200, typeIds: [13], firstEnergyCost: 200 })
    expect(result.moves[0]).toMatchObject({
      id: 205,
      typeId: 13,
      durationMs: 600,
      energy: 8,
      pvpPower: 4,
      pvpEnergy: 9,
      metrics: { pveDps: 8.333, pveEnergyPerSecond: 13.333 },
    })
  })
})
