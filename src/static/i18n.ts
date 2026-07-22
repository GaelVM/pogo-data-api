import type { NormalizedDataset } from '../importer/normalize.js'

export const SUPPORTED_LOCALES = ['en', 'es', 'es-mx'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const spanishTypes: Record<string, string> = {
  normal: 'Normal', fighting: 'Lucha', flying: 'Volador', poison: 'Veneno', ground: 'Tierra', rock: 'Roca',
  bug: 'Bicho', ghost: 'Fantasma', steel: 'Acero', fire: 'Fuego', water: 'Agua', grass: 'Planta',
  electric: 'Eléctrico', psychic: 'Psíquico', ice: 'Hielo', dragon: 'Dragón', dark: 'Siniestro', fairy: 'Hada',
}

const ui = {
  en: { pokemon: 'Pokémon', forms: 'Forms', types: 'Types', moves: 'Moves', events: 'Events', raids: 'Raids', active: 'Active', upcoming: 'Upcoming', search: 'Search' },
  es: { pokemon: 'Pokémon', forms: 'Formas', types: 'Tipos', moves: 'Movimientos', events: 'Eventos', raids: 'Incursiones', active: 'Activo', upcoming: 'Próximo', search: 'Buscar' },
  'es-mx': { pokemon: 'Pokémon', forms: 'Formas', types: 'Tipos', moves: 'Movimientos', events: 'Eventos', raids: 'Incursiones', active: 'Activo', upcoming: 'Próximo', search: 'Buscar' },
} as const

function flatten(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
    if (typeof entry === 'string') return [[key, entry]]
    return Object.entries(flatten(entry))
  }))
}

function translatedName(reference: Record<string, string>, prefixes: string[], id: number, fallback: string) {
  for (const prefix of prefixes) {
    const value = reference[`${prefix}${id}`]
    if (value) return { name: value, translated: true }
  }
  return { name: fallback, translated: false }
}

export function localizedCatalog(dataset: NormalizedDataset, locale: SupportedLocale, rawTranslations: unknown) {
  const reference = flatten(rawTranslations)
  const pokemon = dataset.pokemon.map((entry) => ({ ...entry, canonicalName: entry.name, ...translatedName(reference, ['poke_', 'pokemon_'], entry.id, entry.name) }))
  const forms = dataset.forms.map((entry) => ({ ...entry, canonicalName: entry.name, ...translatedName(reference, ['form_'], entry.formId, entry.name) }))
  const moves = dataset.moves.map((entry) => ({ ...entry, canonicalName: entry.name, ...translatedName(reference, ['move_'], entry.id, entry.name) }))
  const types = dataset.types.map((entry) => {
    const fallback = locale === 'en' ? entry.name : (spanishTypes[entry.slug] ?? entry.name)
    const localized = translatedName(reference, ['poke_type_', 'type_'], entry.id, fallback)
    return { ...entry, canonicalName: entry.name, ...localized, translated: localized.translated || fallback !== entry.name }
  })
  return { locale, fallbackLocale: 'en', ui: ui[locale], pokemon, forms, moves, types }
}

export function pokemonI18n(pokemonId: number, catalogs: ReturnType<typeof localizedCatalog>[]) {
  return {
    pokemonId,
    names: Object.fromEntries(catalogs.map((catalog) => {
      const pokemon = catalog.pokemon.find((entry) => entry.id === pokemonId)
      return [catalog.locale, pokemon?.name]
    })),
  }
}

