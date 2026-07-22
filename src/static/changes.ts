type Category = 'events' | 'raids' | 'eggs' | 'research' | 'rocket'
type Snapshot = Record<Category, unknown[]>

const keys: Record<Category, (entry: Record<string, unknown>) => string> = {
  events: (entry) => String(entry.id ?? entry.eventID ?? entry.name),
  raids: (entry) => `${entry.name}:${entry.tier}`,
  eggs: (entry) => `${entry.name}:${entry.eggType}:${entry.isAdventureSync ?? false}`,
  research: (entry) => `${entry.text}:${entry.type}`,
  rocket: (entry) => `${entry.name}:${entry.title}`,
}

function record(value: unknown) {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function digest(value: unknown) {
  return JSON.stringify(value)
}

export function compareCategory(category: Category, current: unknown[], previous: unknown[]) {
  const identity = keys[category]
  const before = new Map(previous.map((entry) => [identity(record(entry)), entry]))
  const after = new Map(current.map((entry) => [identity(record(entry)), entry]))
  const added = [...after].filter(([key]) => !before.has(key)).map(([, entry]) => entry)
  const removed = [...before].filter(([key]) => !after.has(key)).map(([, entry]) => entry)
  const updated = [...after].filter(([key, entry]) => before.has(key) && digest(before.get(key)) !== digest(entry))
    .map(([key, entry]) => ({ key, before: before.get(key), after: entry }))
  return { category, added, removed, updated, counts: { added: added.length, removed: removed.length, updated: updated.length } }
}

export function changesDataset(current: Snapshot, previous: Partial<Snapshot>, generatedAt = new Date().toISOString()) {
  const categories = (Object.keys(keys) as Category[]).map((category) => compareCategory(category, current[category], previous[category] ?? []))
  const hasPreviousSnapshot = Object.values(previous).some((entries) => entries?.length)
  return {
    generatedAt, hasPreviousSnapshot,
    summary: Object.fromEntries(categories.map((entry) => [entry.category, entry.counts])),
    categories: Object.fromEntries(categories.map((entry) => [entry.category, entry])),
  }
}

