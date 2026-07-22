import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generate } from 'pogo-data-generator'

const outputDirectory = resolve('data/raw')
await mkdir(outputDirectory, { recursive: true })

console.log('Generando snapshot completo...')
const template = {
  pokemon: {
    enabled: true,
    template: {
      pokedexId: true,
      pokemonName: true,
      defaultFormId: true,
      genId: true,
      generation: true,
      legendary: true,
      mythic: true,
      ultraBeast: true,
      buddyDistance: true,
      thirdMoveStardust: true,
      thirdMoveCandy: true,
      family: true,
      attack: true,
      defense: true,
      stamina: true,
      height: true,
      weight: true,
      types: 'typeName',
      quickMoves: 'moveName',
      chargedMoves: 'moveName',
      eliteQuickMoves: 'moveName',
      eliteChargedMoves: 'moveName',
      evolutions: { evoId: true, formId: true, candyCost: true, itemRequirement: true },
      forms: {
        formName: true,
        proto: true,
        isCostume: true,
        attack: true,
        defense: true,
        stamina: true,
        height: true,
        weight: true,
        types: 'typeName',
        quickMoves: 'moveName',
        chargedMoves: 'moveName',
        eliteQuickMoves: 'moveName',
        eliteChargedMoves: 'moveName',
        evolutions: { evoId: true, formId: true, candyCost: true, itemRequirement: true },
        family: true,
      },
    },
  },
  types: { enabled: true },
  moves: {
    enabled: true,
    template: {
      moveId: true,
      moveName: true,
      proto: true,
      type: 'typeName',
      power: true,
      durationMs: true,
      energyDelta: true,
      pvpPower: true,
      pvpEnergyDelta: true,
      pvpDurationTurns: true,
      pvpBuffs: true,
    },
  },
} as unknown as NonNullable<Parameters<typeof generate>[0]>['template']

const data = await generate({ template }) as Record<string, Record<string, unknown>>
const counts = {
  pokemon: Object.keys(data.pokemon ?? {}).length,
  types: Object.keys(data.types ?? {}).length,
  moves: Object.keys(data.moves ?? {}).length,
}

if (counts.pokemon < 100 || counts.types < 10 || counts.moves < 100) {
  throw new Error(`Dataset incompleto; no se guardará: ${JSON.stringify(counts)}`)
}

const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputPath = resolve(outputDirectory, `game-master-${timestamp}.json`)
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

console.log(`Snapshot guardado en ${outputPath}`, counts)
