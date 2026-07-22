import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const REPOSITORY = 'https://raw.githubusercontent.com/GaelVM/DataDuck/data'
const FILES = ['events.json', 'raids.json', 'eggs.json', 'research.json', 'rocket.json'] as const
const PUBLIC_API = process.env.POGO_API_URL ?? 'https://gaelvm.github.io/pogo-data-api/v1'
const PREVIOUS_FILES = {
  events: 'live/events.json', raids: 'live/raid-bosses.json', eggs: 'live/eggs.json',
  research: 'live/research.json', rocket: 'live/rocket.json',
} as const

async function main() {
  const output = resolve('data/external/dataduck')
  const previousOutput = resolve('data/external/previous')
  await mkdir(output, { recursive: true })
  await mkdir(previousOutput, { recursive: true })
  await Promise.all(Object.entries(PREVIOUS_FILES).map(async ([category, path]) => {
    try {
      const response = await fetch(`${PUBLIC_API}/${path}`, { headers: { accept: 'application/json' } })
      if (!response.ok) return
      const value = await response.json()
      if (Array.isArray(value)) await writeFile(resolve(previousOutput, `${category}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    } catch { /* El primer despliegue puede no tener una API anterior. */ }
  }))
  const results = await Promise.all(FILES.map(async (file) => {
    const response = await fetch(`${REPOSITORY}/${file}`, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`DataDuck ${file}: HTTP ${response.status}`)
    const value = await response.json()
    if (!Array.isArray(value)) throw new Error(`DataDuck ${file} no contiene un arreglo JSON`)
    await writeFile(resolve(output, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    return [file, value.length] as const
  }))
  await writeFile(resolve(output, 'meta.json'), `${JSON.stringify({ source: 'GaelVM/DataDuck', branch: 'data', fetchedAt: new Date().toISOString(), counts: Object.fromEntries(results) }, null, 2)}\n`, 'utf8')
  console.log(`DataDuck importado: ${results.map(([file, count]) => `${file}=${count}`).join(', ')}`)
}

await main()
