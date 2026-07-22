import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generate } from 'pogo-data-generator'

const outputDirectory = resolve('data/raw')
await mkdir(outputDirectory, { recursive: true })

console.log('Generando snapshot completo...')
const data = await generate()
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputPath = resolve(outputDirectory, `game-master-${timestamp}.json`)
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

console.log(`Snapshot guardado en ${outputPath}`)
