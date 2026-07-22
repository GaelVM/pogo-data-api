import type { NormalizedDataset } from '../importer/normalize.js'
import type { SupportedLocale } from './i18n.js'
import { pokemonIdFromAsset } from './availability.js'

const typeNames: Record<string, string> = { Dragon: 'Dragón', Grass: 'Planta', Fire: 'Fuego', Water: 'Agua' }

export function translateResearchText(text: string, locale: SupportedLocale) {
  if (locale === 'en') return { text, translated: false }
  const rules: Array<[RegExp, (...values: string[]) => string]> = [
    [/^Catch (\d+) different species of Pokémon$/, (n) => `Captura ${n} especies diferentes de Pokémon`],
    [/^Catch (\d+) Pokémon with Weather Boost$/, (n) => `Captura ${n} Pokémon potenciados por el clima`],
    [/^Catch a (\w+)-type Pokémon$/, (type) => `Captura un Pokémon de tipo ${typeNames[type] ?? type}`],
    [/^Catch (\d+) (\w+)-type Pokémon$/, (n, type) => `Captura ${n} Pokémon de tipo ${typeNames[type] ?? type}`],
    [/^Catch (\d+) (.+)$/, (n, target) => `Captura ${n} ${target}`],
    [/^Win a raid$/, () => 'Gana una incursión'],
    [/^Win (\d+) raids$/, (n) => `Gana ${n} incursiones`],
    [/^Win a three-star raid or higher$/, () => 'Gana una incursión de tres estrellas o superior'],
    [/^Make (\d+) (Nice|Great|Excellent) Throws(?: in a row)?$/, (n, quality) => `Realiza ${n} lanzamientos ${quality === 'Nice' ? 'Buenos' : quality === 'Great' ? 'Geniales' : 'Excelentes'}${text.endsWith('in a row') ? ' seguidos' : ''}`],
    [/^Make (\d+) (Nice|Great|Excellent) Curveball Throws(?: in a row)?$/, (n, quality) => `Realiza ${n} lanzamientos de bola curva ${quality === 'Nice' ? 'Buenos' : quality === 'Great' ? 'Geniales' : 'Excelentes'}${text.endsWith('in a row') ? ' seguidos' : ''}`],
    [/^Make (\d+) Curveball Throws$/, (n) => `Realiza ${n} lanzamientos de bola curva`],
    [/^Explore (\d+) km$/, (n) => `Explora ${n} km`],
    [/^Hatch an Egg$/, () => 'Eclosiona un Huevo'],
    [/^Hatch (\d+) Eggs$/, (n) => `Eclosiona ${n} Huevos`],
    [/^Spin (\d+) PokéStops or Gyms$/, (n) => `Gira ${n} fotodiscos de Poképaradas o Gimnasios`],
    [/^Take a snapshot of a wild Pokémon$/, () => 'Toma una instantánea de un Pokémon salvaje'],
    [/^Earn (\d+) Candies walking with your buddy$/, (n) => `Consigue ${n} Caramelos caminando con tu compañero`],
    [/^Send (\d+) Gifts and add a sticker to each$/, (n) => `Envía ${n} regalos y añade una pegatina a cada uno`],
    [/^Trade a Pokémon$/, () => 'Intercambia un Pokémon'],
    [/^Evolve a Pokémon$/, () => 'Evoluciona un Pokémon'],
    [/^Power up Pokémon (\d+) times$/, (n) => `Da más poder a un Pokémon ${n} veces`],
    [/^Defeat a Team GO Rocket Grunt$/, () => 'Derrota a un Recluta del Team GO Rocket'],
  ]
  for (const [pattern, output] of rules) {
    const match = text.match(pattern)
    if (match) return { text: output(...match.slice(1)), translated: true }
  }
  return { text, translated: false }
}

export function localizedResearch(entries: unknown[], dataset: NormalizedDataset, locale: SupportedLocale, pokemonNames: Map<number, string>) {
  const canonicalNames = new Map(dataset.pokemon.map((pokemon) => [pokemon.id, pokemon.name]))
  let translatedTasks = 0
  const research = entries.map((raw) => {
    const entry = raw as Record<string, unknown>
    const task = translateResearchText(String(entry.text ?? ''), locale)
    if (task.translated) translatedTasks++
    const rewards = Array.isArray(entry.rewards) ? entry.rewards.map((rawReward) => {
      const reward = rawReward as Record<string, unknown>
      const pokemonId = pokemonIdFromAsset(reward.image)
      const canonicalName = pokemonId ? canonicalNames.get(pokemonId) : undefined
      const localizedName = pokemonId ? pokemonNames.get(pokemonId) : undefined
      const simpleSpecies = canonicalName === reward.name
      return { ...reward, pokemonId, canonicalName: reward.name, localizedName: localizedName ?? reward.name,
        name: simpleSpecies && localizedName ? localizedName : reward.name }
    }) : []
    return { ...entry, text: task.text, canonicalText: entry.text, translated: task.translated, rewards }
  })
  return { locale, fallbackLocale: 'en', source: 'GaelVM/DataDuck', coverage: { total: research.length, translated: translatedTasks }, research }
}

