import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMasterfile, type NormalizedDataset } from '../importer/normalize.js'
import type { Masterfile } from '../importer/types.js'
import { defensiveMatchups, typeEffectiveness } from './type-effectiveness.js'
import { combatDataset, combatRankings, formCombat, pvpRankings } from './combat.js'
import { docsHtml } from './docs.js'
import { pvpMovesets } from './pvp-movesets.js'
import { EMPTY_LIVE_DATA, liveEndpoints, validateLiveData, type LiveData } from './live.js'
import { dataDuckEvents, type DataDuckSnapshot } from './dataduck.js'
import { availabilityDataset, globalSearch } from './availability.js'
import { changesDataset } from './changes.js'
import { raidGuides } from './raid-guides.js'
import { ivCalculatorConfig, ivRankingFiles } from './iv-rankings.js'

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

export async function buildStaticApi(masterfile: Masterfile, output = resolve('public'), sourceFile = 'unknown', liveData: LiveData = EMPTY_LIVE_DATA, dataDuck?: DataDuckSnapshot, previous: Record<string, unknown[]> = {}) {
  const dataset = normalizeMasterfile(masterfile)
  const pokemon = pokemonDocuments(dataset)
  const apiRoot = resolve(output, API_VERSION)
  const pokemonRoot = resolve(apiRoot, 'pokemon')
  const typeIndexRoot = resolve(apiRoot, 'indexes/by-type')
  const generationIndexRoot = resolve(apiRoot, 'indexes/by-generation')
  const rarityIndexRoot = resolve(apiRoot, 'indexes/by-rarity')
  const statusIndexRoot = resolve(apiRoot, 'indexes/by-status')
  const translationsRoot = resolve(apiRoot, 'translations')
  const liveRoot = resolve(apiRoot, 'live')
  const liveEventsRoot = resolve(liveRoot, 'events')
  const availabilityIndexRoot = resolve(apiRoot, 'indexes/by-availability')
  const changesRoot = resolve(apiRoot, 'changes')
  const historyRoot = resolve(apiRoot, 'history')
  const raidGuidesRoot = resolve(apiRoot, 'raid-guides')
  const ivRoot = resolve(apiRoot, 'iv-rankings')
  await Promise.all([pokemonRoot, typeIndexRoot, generationIndexRoot, rarityIndexRoot, statusIndexRoot]
    .map((path) => mkdir(path, { recursive: true })))
  await mkdir(translationsRoot, { recursive: true })
  await Promise.all([liveRoot, liveEventsRoot, availabilityIndexRoot, changesRoot, historyRoot, raidGuidesRoot, ivRoot, ...['great', 'ultra', 'master'].map((league) => resolve(ivRoot, league))].map((path) => mkdir(path, { recursive: true })))

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
  const pvp = pvpRankings(dataset)
  const live = liveEndpoints(validateLiveData(liveData))
  const availability = availabilityDataset(dataset, dataDuck, live.events)
  const changes = changesDataset({ events: live.events, raids: dataDuck?.raids ?? [], eggs: dataDuck?.eggs ?? [], research: dataDuck?.research ?? [], rocket: dataDuck?.rocket ?? [] }, previous, generatedAt)
  const guides = raidGuides(dataset, dataDuck)
  const ivFiles = ivRankingFiles(dataset)
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
    writeJson(resolve(apiRoot, 'pvp-rankings.json'), pvp),
    writeJson(resolve(apiRoot, 'pvp-movesets.json'), pvpMovesets(dataset, pvp)),
    writeJson(resolve(liveRoot, 'meta.json'), live.manifest),
    writeJson(resolve(liveRoot, 'events.json'), live.events),
    writeJson(resolve(liveEventsRoot, 'active.json'), live.activeEvents),
    writeJson(resolve(liveEventsRoot, 'upcoming.json'), live.upcomingEvents),
    writeJson(resolve(liveEventsRoot, 'past.json'), live.pastEvents),
    writeJson(resolve(liveRoot, 'raids.json'), live.raids),
    writeJson(resolve(liveRoot, 'active-raids.json'), live.activeRaids),
    writeJson(resolve(liveRoot, 'upcoming-raids.json'), live.upcomingRaids),
    writeJson(resolve(liveRoot, 'calendar.json'), live.calendar),
    writeJson(resolve(liveRoot, 'raid-bosses.json'), dataDuck?.raids ?? []),
    writeJson(resolve(liveRoot, 'eggs.json'), dataDuck?.eggs ?? []),
    writeJson(resolve(liveRoot, 'research.json'), dataDuck?.research ?? []),
    writeJson(resolve(liveRoot, 'rocket.json'), dataDuck?.rocket ?? []),
    writeJson(resolve(liveRoot, 'dataduck-meta.json'), dataDuck?.meta ?? { source: 'GaelVM/DataDuck', available: false }),
    writeJson(resolve(apiRoot, 'availability.json'), availability),
    writeJson(resolve(apiRoot, 'search.json'), globalSearch(dataset, availability)),
    writeJson(resolve(changesRoot, 'latest.json'), changes),
    ...Object.entries(changes.categories).map(([category, value]) => writeJson(resolve(changesRoot, `${category}.json`), { generatedAt, hasPreviousSnapshot: changes.hasPreviousSnapshot, ...value })),
    writeJson(resolve(historyRoot, 'latest.json'), { generatedAt, source: 'GaelVM/DataDuck', changes: 'changes/latest.json', summary: changes.summary }),
    writeJson(resolve(historyRoot, 'index.json'), [{ generatedAt, source: 'GaelVM/DataDuck', url: 'latest.json' }]),
    writeJson(resolve(raidGuidesRoot, 'index.json'), guides.map((guide) => ({ pokemonId: guide.pokemonId, pokemonName: guide.pokemonName, tier: guide.raid.tier, url: `${guide.pokemonId}.json` }))),
    ...guides.map((guide) => writeJson(resolve(raidGuidesRoot, `${guide.pokemonId}.json`), guide)),
    writeJson(resolve(ivRoot, 'config.json'), ivCalculatorConfig()),
    writeJson(resolve(ivRoot, 'index.json'), ivFiles.map((entry) => ({ league: entry.league, pokemonId: entry.pokemonId, pokemonName: entry.pokemonName, url: `${entry.league}/${entry.pokemonId}.json` }))),
    ...ivFiles.map((entry) => writeJson(resolve(ivRoot, entry.league, `${entry.pokemonId}.json`), entry)),
    ...['raids', 'eggs', 'research', 'rocket', 'events'].map((source) => writeJson(resolve(availabilityIndexRoot, `${source}.json`), availability.filter((entry) => entry.sources.includes(source)))),
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
    ...availability.map(async (entry) => {
      const root = resolve(pokemonRoot, String(entry.pokemonId))
      await mkdir(root, { recursive: true })
      await writeJson(resolve(root, 'availability.json'), entry)
    }),
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
  const eventsFile = JSON.parse(await readFile(resolve('data/curated/events.json'), 'utf8')) as Pick<LiveData, 'timezone' | 'events'>
  const raidsFile = JSON.parse(await readFile(resolve('data/curated/raid-bosses.json'), 'utf8')) as Pick<LiveData, 'raids'>
  const externalRoot = resolve('data/external/dataduck')
  const readExternal = async (file: string, fallback: unknown) => readFile(resolve(externalRoot, file), 'utf8').then(JSON.parse).catch(() => fallback)
  const dataDuck: DataDuckSnapshot = {
    meta: await readExternal('meta.json', {}) as Record<string, unknown>,
    events: await readExternal('events.json', []) as DataDuckSnapshot['events'],
    raids: await readExternal('raids.json', []) as unknown[],
    eggs: await readExternal('eggs.json', []) as unknown[],
    research: await readExternal('research.json', []) as unknown[],
    rocket: await readExternal('rocket.json', []) as unknown[],
  }
  const previous = Object.fromEntries(await Promise.all(['events', 'raids', 'eggs', 'research', 'rocket'].map(async (category) => [category, await readFile(resolve('data/external/previous', `${category}.json`), 'utf8').then(JSON.parse).catch(() => [])])))
  const importedEvents = dataDuckEvents(dataDuck.events)
  const metadata = await buildStaticApi(masterfile, resolve('public'), input, { timezone: eventsFile.timezone, events: [...eventsFile.events, ...importedEvents], raids: raidsFile.raids }, dataDuck, previous)
  console.log(`API ${metadata.apiVersion} generada desde ${input}: ${metadata.counts.pokemon} Pokémon`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main()
