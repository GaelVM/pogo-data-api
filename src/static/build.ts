import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMasterfile, type NormalizedDataset } from '../importer/normalize.js'
import type { Masterfile } from '../importer/types.js'
import { defensiveMatchups, typeEffectiveness } from './type-effectiveness.js'
import { combatDataset, combatRankings, formCombat } from './combat.js'
import { docsHtml } from './docs.js'

const API_VERSION = 'v1'

export interface BuildMetadata {
  apiVersion: string
  datasetVersion: string
  generatedAt: string
  sourceFile: string
  counts: Record<string, number>
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function catalog(source: unknown) {
  if (!source || typeof source !== 'object') return []
  return Object.entries(source as Record<string, unknown>).map(([key, value]) => {
    const numericId = Number(key)
    const id = Number.isFinite(numericId) ? numericId : key
    if (value !== null && typeof value === 'object') return { id, ...(value as Record<string, unknown>) }
    return { id, name: value }
  })
}

function translations(source: unknown) {
  return source && typeof source === 'object' ? source as Record<string, unknown> : {}
}

function pokemonDocuments(dataset: NormalizedDataset) {
  const formsByPokemon = new Map<number, NormalizedDataset['forms']>()
  for (const form of dataset.forms) {
    const forms = formsByPokemon.get(form.pokemonId) ?? []
    forms.push(form)
    formsByPokemon.set(form.pokemonId, forms)
  }
  const movesById = new Map(dataset.moves.map((move) => [move.id, move]))
  const typesById = new Map(dataset.types.map((type) => [type.id, type]))

  return dataset.pokemon.map((pokemon) => ({
    ...pokemon,
    forms: (formsByPokemon.get(pokemon.id) ?? []).map((form) => ({
      ...form,
      types: form.typeIds.map((id) => typesById.get(id)).filter(Boolean),
      typeMatchups: defensiveMatchups(form.typeIds, dataset.types),
      combat: formCombat(form),
      moves: form.moves.map((relation) => ({ ...relation, move: movesById.get(relation.moveId) })),
    })),
  }))
}

function families(dataset: NormalizedDataset) {
  const grouped = new Map<number, NormalizedDataset['pokemon']>()
  dataset.pokemon.forEach((pokemon) => {
    const familyId = pokemon.familyId ?? pokemon.id
    const members = grouped.get(familyId) ?? []
    members.push(pokemon)
    grouped.set(familyId, members)
  })
  return [...grouped.entries()].map(([familyId, members]) => ({
    familyId,
    members: members.sort((a, b) => a.id - b.id),
    evolutions: dataset.forms
      .filter((form) => members.some((pokemon) => pokemon.id === form.pokemonId))
      .flatMap((form) => form.evolutions.map((evolution) => ({ fromPokemonId: form.pokemonId, fromFormId: form.formId, ...evolution }))),
  })).sort((a, b) => a.familyId - b.familyId)
}

function temporaryEvolutions(dataset: NormalizedDataset) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  return dataset.forms.flatMap((form) => form.temporaryEvolutions.map((evolution) => ({
    pokemonId: form.pokemonId,
    pokemonName: pokemonById.get(form.pokemonId)?.name,
    formId: form.formId,
    formName: form.name,
    ...evolution,
  })))
}

function gigantamax(dataset: NormalizedDataset) {
  const pokemonById = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon]))
  const movesById = new Map(dataset.moves.map((move) => [move.id, move]))
  return dataset.forms.flatMap((form) => {
    const moves = form.moves.filter((move) => move.availability === 'GMAX')
      .map((relation) => movesById.get(relation.moveId)).filter(Boolean)
    return moves.length ? [{
      pokemonId: form.pokemonId,
      pokemonName: pokemonById.get(form.pokemonId)?.name,
      formId: form.formId,
      formName: form.name,
      moves,
    }] : []
  })
}

function spriteUrls(id: number) {
  const pokeminersRoot = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon'
  const pokeapiRoot = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
  const assetId = String(id).padStart(3, '0')
  return {
    source: 'PokeMiners/pogo_assets',
    default: `${pokeminersRoot}/pokemon_icon_${assetId}_00.png`,
    shiny: `${pokeminersRoot}/pokemon_icon_${assetId}_00_shiny.png`,
    fallbackDefault: `${pokeapiRoot}/${id}.png`,
    fallbackShiny: `${pokeapiRoot}/shiny/${id}.png`,
    officialArtwork: `${pokeapiRoot}/other/official-artwork/${id}.png`,
  }
}

function explorer(dataset: NormalizedDataset) {
  const typesById = new Map(dataset.types.map((type) => [type.id, type]))
  return dataset.pokemon.map((pokemon) => {
    const forms = dataset.forms.filter((form) => form.pokemonId === pokemon.id)
    const form = forms.find((entry) => entry.isDefault) ?? forms[0]
    return {
      id: pokemon.id, slug: pokemon.slug, name: pokemon.name, generation: pokemon.generation,
      legendary: pokemon.legendary, mythic: pokemon.mythic, ultraBeast: pokemon.ultraBeast,
      types: form?.typeIds.map((id) => typesById.get(id)).filter(Boolean) ?? [],
      combat: form ? formCombat(form) : undefined,
      formsCount: forms.length,
      sprites: spriteUrls(pokemon.id),
    }
  })
}

export async function buildStaticApi(masterfile: Masterfile, output = resolve('public'), sourceFile = 'unknown') {
  const dataset = normalizeMasterfile(masterfile)
  const pokemon = pokemonDocuments(dataset)
  const apiRoot = resolve(output, API_VERSION)
  const pokemonRoot = resolve(apiRoot, 'pokemon')
  const typeIndexRoot = resolve(apiRoot, 'indexes/by-type')
  const generationIndexRoot = resolve(apiRoot, 'indexes/by-generation')
  const rarityIndexRoot = resolve(apiRoot, 'indexes/by-rarity')
  const statusIndexRoot = resolve(apiRoot, 'indexes/by-status')
  const translationsRoot = resolve(apiRoot, 'translations')
  await Promise.all([pokemonRoot, typeIndexRoot, generationIndexRoot, rarityIndexRoot, statusIndexRoot]
    .map((path) => mkdir(path, { recursive: true })))
  await mkdir(translationsRoot, { recursive: true })

  const evolutions = dataset.forms.flatMap((form) =>
    form.evolutions.map((evolution) => ({ fromPokemonId: form.pokemonId, fromFormId: form.formId, ...evolution })),
  )
  const generatedAt = new Date().toISOString()
  const metadata: BuildMetadata = {
    apiVersion: API_VERSION,
    datasetVersion: generatedAt.slice(0, 10),
    generatedAt,
    sourceFile: basename(sourceFile),
    counts: { pokemon: pokemon.length, forms: dataset.forms.length, types: dataset.types.length, moves: dataset.moves.length },
  }
  const localized = translations(masterfile.translations)
  const translationManifest = {
    defaultLocale: 'en',
    locales: Object.keys(localized).map((locale) => ({ locale, url: `translations/${locale}.json` })),
  }

  await Promise.all([
    writeJson(resolve(apiRoot, 'pokedex.json'), pokemon),
    writeJson(resolve(apiRoot, 'types.json'), dataset.types),
    writeJson(resolve(apiRoot, 'type-effectiveness.json'), typeEffectiveness(dataset.types)),
    writeJson(resolve(apiRoot, 'moves.json'), dataset.moves),
    writeJson(resolve(apiRoot, 'forms.json'), dataset.forms),
    writeJson(resolve(apiRoot, 'evolutions.json'), evolutions),
    writeJson(resolve(apiRoot, 'families.json'), families(dataset)),
    writeJson(resolve(apiRoot, 'combat.json'), combatDataset(dataset)),
    writeJson(resolve(apiRoot, 'rankings.json'), combatRankings(dataset)),
    writeJson(resolve(apiRoot, 'temporary-evolutions.json'), temporaryEvolutions(dataset)),
    writeJson(resolve(apiRoot, 'items.json'), catalog(masterfile.items)),
    writeJson(resolve(apiRoot, 'quest-types.json'), catalog(masterfile.questTypes)),
    writeJson(resolve(apiRoot, 'quest-conditions.json'), catalog(masterfile.questConditions)),
    writeJson(resolve(apiRoot, 'quest-reward-types.json'), catalog(masterfile.questRewardTypes)),
    writeJson(resolve(apiRoot, 'invasions.json'), catalog(masterfile.invasions)),
    writeJson(resolve(apiRoot, 'weather.json'), catalog(masterfile.weather)),
    writeJson(resolve(apiRoot, 'raids.json'), catalog(masterfile.raids)),
    writeJson(resolve(apiRoot, 'teams.json'), catalog(masterfile.teams)),
    writeJson(resolve(apiRoot, 'route-types.json'), catalog(masterfile.routeTypes)),
    writeJson(resolve(apiRoot, 'translations.json'), translationManifest),
    writeJson(resolve(apiRoot, 'costumes.json'), catalog(masterfile.costumes)),
    writeJson(resolve(apiRoot, 'location-cards.json'), catalog(masterfile.locationCards)),
    writeJson(resolve(apiRoot, 'gigantamax.json'), gigantamax(dataset)),
    writeJson(resolve(apiRoot, 'explorer.json'), explorer(dataset)),
    writeJson(resolve(apiRoot, 'sprites.json'), pokemon.map((entry) => ({ pokemonId: entry.id, ...spriteUrls(entry.id) }))),
    writeJson(resolve(apiRoot, 'meta.json'), metadata),
    writeFile(resolve(output, 'index.html'), docsHtml(), 'utf8'),
    writeFile(resolve(output, '.nojekyll'), '', 'utf8'),
    ...pokemon.map((entry) => writeJson(resolve(pokemonRoot, `${entry.id}.json`), entry)),
    writeJson(resolve(rarityIndexRoot, 'legendary.json'), pokemon.filter((entry) => entry.legendary)),
    writeJson(resolve(rarityIndexRoot, 'mythic.json'), pokemon.filter((entry) => entry.mythic)),
    writeJson(resolve(rarityIndexRoot, 'ultra-beast.json'), pokemon.filter((entry) => entry.ultraBeast)),
    writeJson(resolve(statusIndexRoot, 'released.json'), pokemon.filter((entry) => !entry.unreleased)),
    writeJson(resolve(statusIndexRoot, 'unreleased.json'), pokemon.filter((entry) => entry.unreleased)),
    ...Object.entries(localized).map(([locale, values]) => writeJson(resolve(translationsRoot, `${locale}.json`), values)),
  ])

  for (const type of dataset.types) {
    await writeJson(resolve(typeIndexRoot, `${type.slug}.json`), pokemon.filter((entry) => entry.forms.some((form) => form.typeIds.includes(type.id))))
  }
  for (const generation of new Set(pokemon.map((entry) => entry.generation).filter((id): id is number => id !== undefined))) {
    await writeJson(resolve(generationIndexRoot, `${generation}.json`), pokemon.filter((entry) => entry.generation === generation))
  }

  return metadata
}

async function newestRawFile() {
  const rawDirectory = resolve('data/raw')
  const files = (await readdir(rawDirectory)).filter((file) => file.endsWith('.json')).sort()
  return files.length ? resolve(rawDirectory, files.at(-1)!) : undefined
}

async function main() {
  const input = process.argv[2] ? resolve(process.argv[2]) : ((await newestRawFile()) ?? resolve('data/sample/game-master.sample.json'))
  const masterfile = JSON.parse(await readFile(input, 'utf8')) as Masterfile
  const metadata = await buildStaticApi(masterfile, resolve('public'), input)
  console.log(`API ${metadata.apiVersion} generada desde ${input}: ${metadata.counts.pokemon} Pokémon`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main()
