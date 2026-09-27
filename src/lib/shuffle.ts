import { canFill, type Ingredient, type Role, type Season, type SpiritFamily, type Theme } from './types'

export const MIN_SIZE = 3
export const MAX_SIZE = 7

/**
 * Slot skeletons by set size. Each step up adds the role that most changes
 * the drink rather than simply padding the list.
 */
export const COMPOSITION: Record<number, Role[]> = {
  3: ['base', 'hero', 'sweet'],
  4: ['base', 'modifier', 'hero', 'acid'],
  5: ['base', 'modifier', 'hero', 'acid', 'aromatic'],
  6: ['base', 'modifier', 'hero', 'acid', 'aromatic', 'sweet'],
  7: ['base', 'modifier', 'hero', 'acid', 'aromatic', 'sweet', 'texture'],
}

export type Slot = {
  /** The job this position is meant to do. Preserved across a reroll. */
  role: Role
  ingredient: Ingredient
  locked: boolean
  /** True when chaos let an ingredient land outside its role. */
  wild: boolean
}

export type Filters = {
  size: number
  /** Restrict the base slot to one spirit family. null = any. */
  family: SpiritFamily | null
  /** Hard constraint — dietary and stylistic no-gos. */
  excludedCategories: string[]
  /** Soft constraint — relaxed if it would leave a slot empty. */
  season: Season | null
  /** Soft constraint — relaxed if it would leave a slot empty. */
  theme: Theme | null
  /** 0 = obey the skeleton strictly, 100 = anything can fill any slot. */
  chaos: number
  /** Always present in the set, regardless of role fit. */
  pinnedIds: string[]
  /** Hard constraint when `onlyOwned` is on. */
  onlyOwned: boolean
  ownedIds: string[]
  /** Exclude preparations that need prep work before service. */
  excludeHouse: boolean
}

export const DEFAULT_FILTERS: Filters = {
  size: 5,
  family: null,
  excludedCategories: [],
  season: null,
  theme: null,
  chaos: 0,
  pinnedIds: [],
  onlyOwned: false,
  ownedIds: [],
  excludeHouse: false,
}

export type Rng = () => number

function pick<T>(items: readonly T[], rng: Rng): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}

/** Constraints we will never violate, however narrow the result. */
function passesHard(ingredient: Ingredient, filters: Filters): boolean {
  if (filters.excludedCategories.includes(ingredient.category)) return false
  if (filters.excludeHouse && ingredient.house) return false
  if (filters.onlyOwned && !filters.ownedIds.includes(ingredient.id)) return false
  return true
}

/** Preferences we drop rather than hand back an empty slot. */
function passesSoft(ingredient: Ingredient, filters: Filters): boolean {
  if (filters.season && !ingredient.season?.includes(filters.season)) return false
  if (filters.theme && !ingredient.theme?.includes(filters.theme)) return false
  return true
}

function passesRole(
  ingredient: Ingredient,
  role: Role,
  filters: Filters,
  wild: boolean,
): boolean {
  if (!wild && !canFill(ingredient, role)) return false
  // The spirit picker is an explicit user choice, so it outranks chaos.
  if (role === 'base' && filters.family && ingredient.family !== filters.family) {
    return false
  }
  return true
}

/**
 * Candidates for a slot, relaxing season/theme only if the strict set is empty.
 * Without this ladder, "nordic + winter" silently produces blank slots.
 */
function candidates(
  pool: readonly Ingredient[],
  role: Role,
  filters: Filters,
  usedIds: Set<string>,
  wild: boolean,
): Ingredient[] {
  const base = pool.filter(
    (i) =>
      !usedIds.has(i.id) &&
      passesHard(i, filters) &&
      passesRole(i, role, filters, wild),
  )
  const strict = base.filter((i) => passesSoft(i, filters))
  return strict.length > 0 ? strict : base
}

function rollWild(filters: Filters, rng: Rng): boolean {
  return filters.chaos > 0 && rng() * 100 < filters.chaos
}

/**
 * Seat pinned ingredients before anything else, preferring a slot whose role
 * they genuinely fit. A pin is an explicit instruction, so if nothing fits we
 * still place it — user intent beats the skeleton.
 */
function seatPins(
  template: Role[],
  pool: readonly Ingredient[],
  filters: Filters,
): Map<number, Ingredient> {
  const seated = new Map<number, Ingredient>()
  const taken = new Set<number>()

  for (const id of filters.pinnedIds) {
    const ingredient = pool.find((i) => i.id === id)
    if (!ingredient) continue

    let index = template.findIndex(
      (role, i) => !taken.has(i) && ingredient.role === role,
    )
    if (index === -1) {
      index = template.findIndex(
        (role, i) => !taken.has(i) && canFill(ingredient, role),
      )
    }
    if (index === -1) {
      index = template.findIndex((_, i) => !taken.has(i))
    }
    if (index === -1) break

    taken.add(index)
    seated.set(index, ingredient)
  }

  return seated
}

/**
 * Build a set. Locked slots in `keep` are carried over untouched, so this
 * serves both the first shuffle and every reroll of the unlocked remainder.
 */
export function generateSet({
  pool,
  filters,
  keep = [],
  rng = Math.random,
}: {
  pool: readonly Ingredient[]
  filters: Filters
  keep?: Slot[]
  rng?: Rng
}): Slot[] {
  const size = Math.min(Math.max(filters.size, MIN_SIZE), MAX_SIZE)
  const template = [...COMPOSITION[size]]

  const locked = keep.filter((s) => s.locked)
  const slots: (Slot | null)[] = new Array(size).fill(null)
  const usedIds = new Set<string>()

  // Locked slots hold their position where possible, so the set doesn't
  // visually reshuffle underneath the bartender.
  for (const slot of locked) {
    let index = template.findIndex((role, i) => slots[i] === null && role === slot.role)
    if (index === -1) index = template.findIndex((_, i) => slots[i] === null)
    if (index === -1) continue
    slots[index] = { ...slot }
    usedIds.add(slot.ingredient.id)
  }

  const pins = seatPins(template, pool, filters)
  for (const [index, ingredient] of pins) {
    if (slots[index] !== null || usedIds.has(ingredient.id)) continue
    slots[index] = {
      role: template[index],
      ingredient,
      locked: false,
      wild: !canFill(ingredient, template[index]),
    }
    usedIds.add(ingredient.id)
  }

  for (let i = 0; i < size; i++) {
    if (slots[i] !== null) continue
    const role = template[i]
    const wild = rollWild(filters, rng)
    let chosen = pick(candidates(pool, role, filters, usedIds, wild), rng)
    // A wild roll can narrow harder than a strict one (e.g. an exhausted
    // pool), so fall back to the role-respecting set before giving up.
    if (!chosen && wild) {
      chosen = pick(candidates(pool, role, filters, usedIds, false), rng)
    }
    if (!chosen) continue

    slots[i] = {
      role,
      ingredient: chosen,
      locked: false,
      wild: !canFill(chosen, role),
    }
    usedIds.add(chosen.id)
  }

  return slots.filter((s): s is Slot => s !== null)
}

/**
 * Replace one slot, keeping its role. Discarding the acid gets you a
 * different acid, so the skeleton survives while you hunt for the right piece.
 */
export function rerollSlot({
  slots,
  index,
  pool,
  filters,
  rng = Math.random,
  ignoreRole = false,
}: {
  slots: Slot[]
  index: number
  pool: readonly Ingredient[]
  filters: Filters
  rng?: Rng
  ignoreRole?: boolean
}): Slot[] {
  const target = slots[index]
  if (!target) return slots

  const usedIds = new Set(
    slots.filter((_, i) => i !== index).map((s) => s.ingredient.id),
  )
  usedIds.add(target.ingredient.id)

  const wild = ignoreRole || rollWild(filters, rng)
  let chosen = pick(candidates(pool, target.role, filters, usedIds, wild), rng)
  if (!chosen && wild) {
    chosen = pick(candidates(pool, target.role, filters, usedIds, false), rng)
  }
  if (!chosen) {
    // Nothing else available — allow the current ingredient back rather
    // than dropping the slot entirely.
    usedIds.delete(target.ingredient.id)
    chosen = pick(candidates(pool, target.role, filters, usedIds, false), rng)
  }
  if (!chosen) return slots

  const next = [...slots]
  next[index] = {
    role: target.role,
    ingredient: chosen,
    locked: false,
    wild: !canFill(chosen, target.role),
  }
  return next
}

export function toggleLock(slots: Slot[], index: number): Slot[] {
  return slots.map((s, i) => (i === index ? { ...s, locked: !s.locked } : s))
}

export function formatSet(slots: Slot[]): string {
  return slots.map((s) => s.ingredient.name).join(' · ')
}
