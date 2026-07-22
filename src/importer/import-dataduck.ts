import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const REPOSITORY = 'https://raw.githubusercontent.com/GaelVM/DataDuck/data'
const FILES = ['events.json', 'raids.json', 'eggs.json', 'research.json', 'rocket.json'] as const

async function main() {
  const output = resolve('data/external/dataduck')
  await mkdir(output, { recursive: true })
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

