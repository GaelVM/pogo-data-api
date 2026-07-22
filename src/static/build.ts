import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMasterfile, type NormalizedDataset } from '../importer/normalize.js'
import type { Masterfile } from '../importer/types.js'

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
      moves: form.moves.map((relation) => ({ ...relation, move: movesById.get(relation.moveId) })),
    })),
  }))
}

function docsHtml() {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PoGo Data API</title><style>
body{max-width:900px;margin:60px auto;padding:0 22px;font:16px/1.6 system-ui;color:#172033;background:#f7f9fc}
h1{font-size:clamp(2rem,6vw,4rem);margin-bottom:0}.card{background:white;padding:24px;border-radius:16px;box-shadow:0 8px 30px #18244b12}
code,a{color:#3157d5}li{margin:.55rem 0}.muted{color:#63708a}
</style></head><body><h1>PoGo Data API</h1><p class="muted">API JSON estática, abierta y versionada de datos de Pokémon GO.</p>
<section class="card"><h2>Endpoints v1</h2><ul>
<li><a href="v1/pokedex.json"><code>/v1/pokedex.json</code></a></li>
<li><a href="v1/types.json"><code>/v1/types.json</code></a></li>
<li><a href="v1/moves.json"><code>/v1/moves.json</code></a></li>
<li><a href="v1/forms.json"><code>/v1/forms.json</code></a></li>
<li><a href="v1/evolutions.json"><code>/v1/evolutions.json</code></a></li>
<li><a href="v1/meta.json"><code>/v1/meta.json</code></a></li>
</ul><p>Cada Pokémon también está disponible en <code>/v1/pokemon/{id}.json</code>. Los índices precomputados están en <code>/v1/indexes/</code>.</p></section></body></html>`
}

export async function buildStaticApi(masterfile: Masterfile, output = resolve('public'), sourceFile = 'unknown') {
  const dataset = normalizeMasterfile(masterfile)
  const pokemon = pokemonDocuments(dataset)
  const apiRoot = resolve(output, API_VERSION)
  const pokemonRoot = resolve(apiRoot, 'pokemon')
  const typeIndexRoot = resolve(apiRoot, 'indexes/by-type')
  const generationIndexRoot = resolve(apiRoot, 'indexes/by-generation')
  await Promise.all([pokemonRoot, typeIndexRoot, generationIndexRoot].map((path) => mkdir(path, { recursive: true })))

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

  await Promise.all([
    writeJson(resolve(apiRoot, 'pokedex.json'), pokemon),
    writeJson(resolve(apiRoot, 'types.json'), dataset.types),
    writeJson(resolve(apiRoot, 'moves.json'), dataset.moves),
    writeJson(resolve(apiRoot, 'forms.json'), dataset.forms),
    writeJson(resolve(apiRoot, 'evolutions.json'), evolutions),
    writeJson(resolve(apiRoot, 'meta.json'), metadata),
    writeFile(resolve(output, 'index.html'), docsHtml(), 'utf8'),
    writeFile(resolve(output, '.nojekyll'), '', 'utf8'),
    ...pokemon.map((entry) => writeJson(resolve(pokemonRoot, `${entry.id}.json`), entry)),
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
