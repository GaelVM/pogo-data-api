import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildStaticApi } from '../src/static/build.js'
import type { Masterfile } from '../src/importer/types.js'

describe('static API build', () => {
  it('genera endpoints, documentos individuales e índices', async () => {
    const fixture = JSON.parse(await readFile(resolve('data/sample/game-master.sample.json'), 'utf8')) as Masterfile
    const output = resolve('/tmp/pogo-data-api-static-test')
    const meta = await buildStaticApi(fixture, output, 'fixture.json')
    const bulbasaur = JSON.parse(await readFile(resolve(output, 'v1/pokemon/1.json'), 'utf8'))
    const grass = JSON.parse(await readFile(resolve(output, 'v1/indexes/by-type/grass.json'), 'utf8'))
    const families = JSON.parse(await readFile(resolve(output, 'v1/families.json'), 'utf8'))
    const combat = JSON.parse(await readFile(resolve(output, 'v1/combat.json'), 'utf8'))
    const released = JSON.parse(await readFile(resolve(output, 'v1/indexes/by-status/released.json'), 'utf8'))
    const items = JSON.parse(await readFile(resolve(output, 'v1/items.json'), 'utf8'))
    const translationManifest = JSON.parse(await readFile(resolve(output, 'v1/translations.json'), 'utf8'))
    const costumes = JSON.parse(await readFile(resolve(output, 'v1/costumes.json'), 'utf8'))
    const docs = await readFile(resolve(output, 'index.html'), 'utf8')
    const explorer = JSON.parse(await readFile(resolve(output, 'v1/explorer.json'), 'utf8'))
    const pvp = JSON.parse(await readFile(resolve(output, 'v1/pvp-rankings.json'), 'utf8'))

    expect(meta.counts.pokemon).toBe(2)
    expect(bulbasaur.name).toBe('Bulbasaur')
    expect(grass.map((pokemon: { id: number }) => pokemon.id)).toEqual([1, 2])
    expect(families[0].members.map((pokemon: { id: number }) => pokemon.id)).toEqual([1, 2])
    expect(combat[0]).toMatchObject({ pokemonId: 1, maxCp: { level40: 1115, level50: 1260 } })
    expect(released).toHaveLength(2)
    expect(items).toEqual([])
    expect(translationManifest).toEqual({ defaultLocale: 'en', locales: [] })
    expect(costumes).toEqual([])
    expect(docs).toContain('Catálogo de endpoints')
    expect(docs).toContain('data-copy="v1/pokedex.json"')
    expect(docs).toContain('id="search"')
    expect(docs).toContain('id="pokemonSearch"')
    expect(explorer[0]).toMatchObject({ id: 1, name: 'Bulbasaur', formsCount: 1 })
    expect(pvp.leagues.great.name).toBe('Liga Super')
  })
})
