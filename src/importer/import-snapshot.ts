import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../database.js'
import { importSnapshot } from './importer.js'

async function latestSnapshot() {
  const directory = resolve('data/raw')
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.json'))
    .sort()
  const latest = files.at(-1)
  if (!latest) throw new Error('No hay snapshots. Ejecuta npm run data:generate primero.')
  return resolve(directory, latest)
}

const input = process.argv[2] ? resolve(process.argv[2]) : await latestSnapshot()

try {
  const result = await importSnapshot(input, prisma)
  console.log(result.skipped ? 'El snapshot ya estaba importado.' : 'Snapshot importado correctamente.')
  console.log(result.version)
} finally {
  await prisma.$disconnect()
}
