import { INGREDIENTS } from './data/ingredients'
import { canFill, type Ingredient, type Role, type SpiritFamily } from './types'

/**
 * The only module that knows where ingredient data lives. Swapping the static
 * seed for SQLite, Turso or IndexedDB means rewriting this file and nothing else.
 */

export const INGREDIENT_SEED: readonly Ingredient[] = INGREDIENTS

export function buildIndex(pool: readonly Ingredient[]): Map<string, Ingredient> {
  return new Map(pool.map((i) => [i.id, i]))
}

export function getById(
  pool: readonly Ingredient[],
  id: string,
): Ingredient | undefined {
  return pool.find((i) => i.id === id)
}

export function forRole(
  pool: readonly Ingredient[],
  role: Role,
): Ingredient[] {
  return pool.filter((i) => canFill(i, role))
}

export function allCategories(pool: readonly Ingredient[]): string[] {
  return [...new Set(pool.map((i) => i.category))].sort()
}

export function familiesInPool(pool: readonly Ingredient[]): SpiritFamily[] {
  const families = pool
    .map((i) => i.family)
    .filter((f): f is SpiritFamily => !!f)
  return [...new Set(families)]
}

export function search(pool: readonly Ingredient[], query: string): Ingredient[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...pool]
  return pool.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.flavorTags.some((t) => t.includes(q)),
  )
}
