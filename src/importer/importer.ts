import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { PrismaClient } from '@prisma/client'
import { normalizeMasterfile } from './normalize.js'
import type { Masterfile } from './types.js'

export async function importSnapshot(
  filePath: string,
  database = new PrismaClient(),
) {
  const raw = await readFile(filePath, 'utf8')
  const hash = createHash('sha256').update(raw).digest('hex')
  const masterfile = JSON.parse(raw) as Masterfile
  const data = normalizeMasterfile(masterfile)
  const version = `${new Date().toISOString().slice(0, 10)}-${hash.slice(0, 12)}`

  const existing = await database.datasetVersion.findUnique({ where: { version } })
  if (existing) return { version: existing, skipped: true }

  const result = await database.$transaction(async (tx) => {
    for (const type of data.types) {
      await tx.type.upsert({ where: { id: type.id }, create: type, update: type })
    }

    for (const pokemon of data.pokemon) {
      await tx.pokemon.upsert({ where: { id: pokemon.id }, create: pokemon, update: pokemon })
    }

    for (const move of data.moves) {
      const typeExists = move.typeId ? data.types.some((type) => type.id === move.typeId) : false
      const payload = { ...move, typeId: typeExists ? move.typeId : undefined }
      await tx.move.upsert({ where: { id: move.id }, create: payload, update: payload })
    }

    await tx.evolution.deleteMany()
    await tx.pokemonMove.deleteMany()
    await tx.pokemonType.deleteMany()

    const formIds = new Map<string, bigint>()
    for (const form of data.forms) {
      const { typeIds, moves, evolutions: _evolutions, ...payload } = form
      void _evolutions
      const saved = await tx.pokemonForm.upsert({
        where: { pokemonId_formId: { pokemonId: form.pokemonId, formId: form.formId } },
        create: payload,
        update: payload,
      })
      formIds.set(`${form.pokemonId}:${form.formId}`, saved.id)

      if (typeIds.length) {
        await tx.pokemonType.createMany({
          data: typeIds.map((typeId, slot) => ({ pokemonFormId: saved.id, typeId, slot: slot + 1 })),
          skipDuplicates: true,
        })
      }
      if (moves.length) {
        await tx.pokemonMove.createMany({
          data: moves.map((move) => ({
            pokemonFormId: saved.id,
            moveId: move.moveId,
            availability: move.availability === 'GMAX' ? 'EVENT' as const : move.availability,
          })),
          skipDuplicates: true,
        })
      }
    }

    for (const form of data.forms) {
      const fromFormId = formIds.get(`${form.pokemonId}:${form.formId}`)
      if (!fromFormId) continue
      for (const evolution of form.evolutions) {
        const exact = evolution.form
          ? formIds.get(`${evolution.pokemon}:${evolution.form}`)
          : undefined
        const fallback = data.forms.find(
          (candidate) => candidate.pokemonId === evolution.pokemon && candidate.isDefault,
        )
        const toFormId = exact ?? (fallback ? formIds.get(`${fallback.pokemonId}:${fallback.formId}`) : undefined)
        if (!toFormId) continue
        await tx.evolution.create({
          data: {
            fromFormId,
            toFormId,
            candyCost: evolution.candyCost,
            itemId: evolution.item,
          },
        })
      }
    }

    await tx.datasetVersion.updateMany({ where: { active: true }, data: { active: false } })
    return tx.datasetVersion.create({
      data: {
        version,
        source: filePath,
        sourceHash: hash,
        pokemonCount: data.pokemon.length,
        formCount: data.forms.length,
        moveCount: data.moves.length,
        active: true,
      },
    })
  }, { timeout: 120_000 })

  return { version: result, skipped: false }
}
