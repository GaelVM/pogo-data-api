import type { SupportedLocale } from '../../static/i18n.js'
import { translateResearchText } from '../../static/research-i18n.js'

type JsonObject = Record<string, unknown>

const exactTranslations: Record<string, string> = {
  'Event': 'Evento',
  'Raid Battles': 'Incursiones',
  'Community Day': 'Día de la Comunidad',
  'Spotlight Hour': 'Hora destacada',
  'Raid Hour': 'Hora legendaria',
  'Research Day': 'Día de investigación',
  'Hatch Day': 'Día de eclosiones',
  'Max Battles': 'Combates Max',
  'GO Battle League': 'Liga Combates GO',
  'Increased Spawns': 'Apariciones aumentadas',
  'Increased shiny chance': 'Mayor probabilidad de encontrar Pokémon variocolor',
  '1-hour Lures': 'Módulos Cebo de 1 hora',
  '3-hour Incense': 'Incienso de 3 horas',
  '3-hour Incense (excluding Daily Adventure Incense)': 'Incienso de 3 horas (excepto el Incienso de aventura diario)',
  '3-hour Lures': 'Módulos Cebo de 3 horas',
  'Incense': 'Incienso',
  'Incubator': 'Incubadora',
  'Stardust': 'Polvo Estelar',
  'Rare Candy': 'Caramelo Raro',
  'Fast TM': 'MT de ataque rápido',
  'Charged TM': 'MT de ataque cargado',
  'Ultra Ball': 'Ultra Ball',
}

const wordTranslations: Array<[RegExp, string]> = [
  [/\bGreat League\b/g, 'Liga Super'],
  [/\bUltra League\b/g, 'Liga Ultra'],
  [/\bMaster League\b/g, 'Liga Master'],
  [/\bCatch Candy XL\b/g, 'Caramelos XL por captura'],
  [/\bCatch Candy\b/g, 'Caramelos por captura'],
  [/\bCatch Stardust\b/g, 'Polvo Estelar por captura'],
  [/\bCatch XP\b/g, 'PX por captura'],
  [/\bHatch Stardust\b/g, 'Polvo Estelar por eclosión'],
  [/\bHatch XP\b/g, 'PX por eclosión'],
  [/\bHatch Candy\b/g, 'Caramelos por eclosión'],
  [/\bTrade Candy XL\b/g, 'Caramelos XL por intercambio'],
  [/\bTrade Candy\b/g, 'Caramelos por intercambio'],
  [/\bRaid Battles\b/g, 'incursiones'],
  [/\bShadow Raids\b/g, 'incursiones oscuras'],
  [/\bMega Raids\b/g, 'megaincursiones'],
  [/\bMax Battles\b/g, 'Combates Max'],
  [/\bPokémon encounters\b/g, 'encuentros con Pokémon'],
  [/\bField Research\b/g, 'investigaciones de campo'],
  [/\bSpecial Research\b/g, 'investigación especial'],
  [/\bTimed Research\b/g, 'investigación temporal'],
  [/\bCollection Challenge\b/g, 'desafío de colección'],
]

export function translateCalendarText(text: string, locale: SupportedLocale) {
  if (locale === 'en' || !text) return { text, translated: false }
  const exact = exactTranslations[text]
  if (exact) return { text: exact, translated: exact !== text }

  const research = translateResearchText(text, locale)
  if (research.translated) return research

  const rules: Array<[RegExp, (...values: string[]) => string]> = [
    [/^(.+) Spotlight Hour$/, (pokemon) => `Hora destacada de ${pokemon}`],
    [/^(.+) Community Day(?: Classic)?$/, (pokemon) => `Día de la Comunidad${text.endsWith('Classic') ? ' clásico' : ''} de ${pokemon}`],
    [/^(.+) Raid Hour$/, (pokemon) => `Hora legendaria de ${pokemon}`],
    [/^(.+) Research Day$/, (pokemon) => `Día de investigación de ${pokemon}`],
    [/^(.+) Hatch Day$/, (pokemon) => `Día de eclosiones de ${pokemon}`],
    [/^Mega (.+) in Mega Raids$/, (pokemon) => `Mega-${pokemon} en megaincursiones`],
    [/^Shadow (.+) in Shadow Raids$/, (pokemon) => `${pokemon} oscuro en incursiones oscuras`],
    [/^(.+) in (\d+)-star Raid Battles$/, (pokemon, stars) => `${pokemon} en incursiones de ${stars} estrellas`],
    [/^Dynamax (.+) during Max Monday$/, (pokemon) => `${pokemon} Dinamax durante el Lunes Max`],
    [/^Gigantamax (.+) Max Battle Day$/, (pokemon) => `Día de Combates Max de ${pokemon} Gigamax`],
    [/^(\d+)x (.+)$/, (amount, bonus) => `${amount}× ${translateCalendarText(bonus, locale).text}`],
    [/^(\d+)x chance (.+)$/, (amount, bonus) => `${amount}× de probabilidad de ${translateCalendarText(bonus, locale).text}`],
    [/^(\d+)-hour (.+)$/, (hours, item) => `${translateCalendarText(item, locale).text} de ${hours} horas`],
  ]
  for (const [pattern, output] of rules) {
    const match = text.match(pattern)
    if (match) return { text: output(...match.slice(1)), translated: true }
  }

  let translated = text
  for (const [pattern, replacement] of wordTranslations) translated = translated.replace(pattern, replacement)
  return { text: translated, translated: translated !== text }
}

function localizeValue(value: unknown, locale: SupportedLocale, key = ''): unknown {
  if (Array.isArray(value)) return value.map((entry) => localizeValue(entry, locale, key))
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    const translatableKeys = new Set(['text', 'bonus', 'description', 'heading', 'title'])
    return translatableKeys.has(key) ? translateCalendarText(value, locale).text : value
  }
  return Object.fromEntries(Object.entries(value as JsonObject).map(([entryKey, entryValue]) =>
    [entryKey, localizeValue(entryValue, locale, entryKey)]))
}

export function localizedCalendar(entries: unknown[], locale: SupportedLocale) {
  return entries.map((raw) => {
    const entry = raw as JsonObject
    const name = translateCalendarText(String(entry.name ?? ''), locale)
    const description = typeof entry.description === 'string'
      ? translateCalendarText(entry.description, locale)
      : undefined
    const bonuses = Array.isArray(entry.bonuses)
      ? entry.bonuses.map((bonus) => translateCalendarText(String(bonus), locale).text)
      : entry.bonuses
    const extraData = localizeValue(entry.extraData, locale)
    return {
      ...entry,
      locale,
      fallbackLocale: 'en',
      canonicalName: entry.name,
      name: name.text,
      ...(typeof entry.description === 'string'
        ? { canonicalDescription: entry.description, description: description?.text }
        : {}),
      bonuses,
      extraData,
      translated: name.translated || Boolean(description?.translated)
        || JSON.stringify(bonuses) !== JSON.stringify(entry.bonuses)
        || JSON.stringify(extraData) !== JSON.stringify(entry.extraData),
    }
  })
}