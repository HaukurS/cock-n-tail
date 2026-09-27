import { describe, expect, it } from 'vitest'
import { INGREDIENT_SEED } from './ingredients'
import {
  COMPOSITION,
  DEFAULT_FILTERS,
  generateSet,
  MAX_SIZE,
  MIN_SIZE,
  rerollSlot,
  toggleLock,
  type Filters,
} from './shuffle'
import { canFill } from './types'

/** Deterministic RNG so failures are reproducible. */
function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const pool = INGREDIENT_SEED

function filters(overrides: Partial<Filters> = {}): Filters {
  return { ...DEFAULT_FILTERS, ...overrides }
}

describe('generateSet', () => {
  it('returns exactly the requested number of slots at every size', () => {
    for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
      const slots = generateSet({ pool, filters: filters({ size }), rng: seeded(size) })
      expect(slots).toHaveLength(size)
    }
  })

  it('clamps sizes outside the supported range', () => {
    expect(generateSet({ pool, filters: filters({ size: 1 }), rng: seeded(1) })).toHaveLength(MIN_SIZE)
    expect(generateSet({ pool, filters: filters({ size: 99 }), rng: seeded(1) })).toHaveLength(MAX_SIZE)
  })

  it('fills every slot with an ingredient that can do that job at chaos 0', () => {
    for (let seed = 0; seed < 50; seed++) {
      const slots = generateSet({ pool, filters: filters({ size: 7 }), rng: seeded(seed) })
      for (const slot of slots) {
        expect(canFill(slot.ingredient, slot.role), `${slot.ingredient.name} in ${slot.role}`).toBe(true)
        expect(slot.wild).toBe(false)
      }
    }
  })

  it('follows the composition skeleton in order', () => {
    const slots = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(7) })
    expect(slots.map((s) => s.role)).toEqual(COMPOSITION[5])
  })

  it('never repeats an ingredient within a set', () => {
    for (let seed = 0; seed < 100; seed++) {
      const slots = generateSet({ pool, filters: filters({ size: 7, chaos: 60 }), rng: seeded(seed) })
      const ids = slots.map((s) => s.ingredient.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('honours the base spirit family even when chaos is maxed', () => {
    for (let seed = 0; seed < 40; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 6, family: 'agave', chaos: 100 }),
        rng: seeded(seed),
      })
      const base = slots.find((s) => s.role === 'base')
      expect(base?.ingredient.family).toBe('agave')
    }
  })

  it('treats excluded categories as a hard constraint', () => {
    for (let seed = 0; seed < 40; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 7, excludedCategories: ['dairy', 'egg'], chaos: 100 }),
        rng: seeded(seed),
      })
      for (const slot of slots) {
        expect(['dairy', 'egg']).not.toContain(slot.ingredient.category)
      }
    }
  })

  it('excludes house preparations when asked', () => {
    for (let seed = 0; seed < 40; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 7, excludeHouse: true }),
        rng: seeded(seed),
      })
      expect(slots.every((s) => !s.ingredient.house)).toBe(true)
    }
  })

  it('restricts to owned ingredients when My Bar is active', () => {
    const ownedIds = pool.slice(0, 60).map((i) => i.id)
    const slots = generateSet({
      pool,
      filters: filters({ size: 4, onlyOwned: true, ownedIds }),
      rng: seeded(11),
    })
    for (const slot of slots) {
      expect(ownedIds).toContain(slot.ingredient.id)
    }
  })

  it('carries locked slots through a reshuffle unchanged', () => {
    const first = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(3) })
    const keep = toggleLock(toggleLock(first, 0), 2)
    const second = generateSet({ pool, filters: filters({ size: 5 }), keep, rng: seeded(99) })

    expect(second[0].ingredient.id).toBe(first[0].ingredient.id)
    expect(second[2].ingredient.id).toBe(first[2].ingredient.id)
    expect(second[0].locked).toBe(true)
    expect(second[2].locked).toBe(true)
  })

  it('rerolls the unlocked slots while locks hold', () => {
    const first = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(3) })
    const keep = toggleLock(first, 0)
    const second = generateSet({ pool, filters: filters({ size: 5 }), keep, rng: seeded(41) })

    const changed = second.some((s, i) => s.ingredient.id !== first[i].ingredient.id)
    expect(changed).toBe(true)
  })

  it('always includes pinned ingredients', () => {
    const pinnedIds = ['sol-dulse', 'miso']
    for (let seed = 0; seed < 40; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 5, pinnedIds }),
        rng: seeded(seed),
      })
      const ids = slots.map((s) => s.ingredient.id)
      for (const id of pinnedIds) expect(ids).toContain(id)
    }
  })

  it('relaxes season and theme rather than leaving a slot empty', () => {
    // Deliberately over-constrained: almost nothing is both nordic and winter.
    for (let seed = 0; seed < 30; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 7, theme: 'nordic', season: 'winter' }),
        rng: seeded(seed),
      })
      expect(slots).toHaveLength(7)
      expect(slots.every((s) => !!s.ingredient)).toBe(true)
    }
  })

  it('prefers on-theme ingredients when enough of them exist', () => {
    const slots = generateSet({
      pool,
      filters: filters({ size: 5, theme: 'tiki' }),
      rng: seeded(5),
    })
    const onTheme = slots.filter((s) => s.ingredient.theme?.includes('tiki'))
    expect(onTheme.length).toBeGreaterThan(0)
  })

  it('lets ingredients land off-role at full chaos', () => {
    let wildSeen = 0
    for (let seed = 0; seed < 60; seed++) {
      const slots = generateSet({
        pool,
        filters: filters({ size: 7, chaos: 100 }),
        rng: seeded(seed),
      })
      wildSeen += slots.filter((s) => s.wild).length
    }
    expect(wildSeen).toBeGreaterThan(0)
  })
})

describe('rerollSlot', () => {
  it('keeps the slot role and swaps the ingredient', () => {
    const slots = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(8) })
    for (let index = 0; index < slots.length; index++) {
      const next = rerollSlot({ slots, index, pool, filters: filters(), rng: seeded(index + 200) })
      expect(next[index].role).toBe(slots[index].role)
      expect(next[index].ingredient.id).not.toBe(slots[index].ingredient.id)
      expect(canFill(next[index].ingredient, next[index].role)).toBe(true)
    }
  })

  it('leaves the other slots untouched', () => {
    const slots = generateSet({ pool, filters: filters({ size: 6 }), rng: seeded(12) })
    const next = rerollSlot({ slots, index: 3, pool, filters: filters(), rng: seeded(77) })
    for (let i = 0; i < slots.length; i++) {
      if (i === 3) continue
      expect(next[i].ingredient.id).toBe(slots[i].ingredient.id)
    }
  })

  it('never introduces a duplicate of another slot', () => {
    const slots = generateSet({ pool, filters: filters({ size: 7 }), rng: seeded(21) })
    for (let seed = 0; seed < 30; seed++) {
      const next = rerollSlot({ slots, index: 2, pool, filters: filters(), rng: seeded(seed) })
      const ids = next.map((s) => s.ingredient.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('can ignore the role on request', () => {
    const slots = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(31) })
    const next = rerollSlot({
      slots,
      index: 4,
      pool,
      filters: filters(),
      rng: seeded(64),
      ignoreRole: true,
    })
    expect(next[4].role).toBe(slots[4].role)
    expect(next[4].ingredient.id).not.toBe(slots[4].ingredient.id)
  })

  it('returns the set unchanged for an out-of-range index', () => {
    const slots = generateSet({ pool, filters: filters({ size: 4 }), rng: seeded(2) })
    expect(rerollSlot({ slots, index: 9, pool, filters: filters(), rng: seeded(2) })).toBe(slots)
  })
})

describe('toggleLock', () => {
  it('flips only the targeted slot', () => {
    const slots = generateSet({ pool, filters: filters({ size: 5 }), rng: seeded(4) })
    const next = toggleLock(slots, 1)
    expect(next[1].locked).toBe(true)
    expect(next.filter((s) => s.locked)).toHaveLength(1)
    expect(toggleLock(next, 1)[1].locked).toBe(false)
  })
})
