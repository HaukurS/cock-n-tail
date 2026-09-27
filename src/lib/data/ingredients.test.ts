import { describe, expect, it } from 'vitest'
import { forRole } from '@/lib/ingredients'
import { COMPOSITION, MAX_SIZE } from '@/lib/shuffle'
import { FLAVOR_TAGS, ROLES, SEASONS, SPIRIT_FAMILIES, THEMES } from '@/lib/types'
import { INGREDIENTS } from './ingredients'

describe('ingredient library integrity', () => {
  it('has unique ids', () => {
    const ids = INGREDIENTS.map((i) => i.id)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates).toEqual([])
  })

  it('has unique names', () => {
    const names = INGREDIENTS.map((i) => i.name)
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i)
    expect(duplicates).toEqual([])
  })

  it('gives every ingredient at least one flavour tag', () => {
    const untagged = INGREDIENTS.filter((i) => i.flavorTags.length === 0)
    expect(untagged.map((i) => i.id)).toEqual([])
  })

  it('uses only vocabulary values', () => {
    for (const i of INGREDIENTS) {
      expect(ROLES).toContain(i.role)
      for (const tag of i.flavorTags) expect(FLAVOR_TAGS).toContain(tag)
      for (const role of i.altRoles ?? []) expect(ROLES).toContain(role)
      for (const s of i.season ?? []) expect(SEASONS).toContain(s)
      for (const t of i.theme ?? []) expect(THEMES).toContain(t)
      if (i.family) expect(SPIRIT_FAMILIES).toContain(i.family)
    }
  })

  it('assigns a spirit family to every base and to nothing else', () => {
    for (const i of INGREDIENTS) {
      if (i.role === 'base') expect(i.family, i.id).toBeDefined()
      else expect(i.family, i.id).toBeUndefined()
    }
  })

  it('never lists a primary role again in altRoles', () => {
    const redundant = INGREDIENTS.filter((i) => i.altRoles?.includes(i.role))
    expect(redundant.map((i) => i.id)).toEqual([])
  })

  it('has enough candidates per role to fill the largest set without repeats', () => {
    for (const role of COMPOSITION[MAX_SIZE]) {
      expect(forRole(INGREDIENTS, role).length, role).toBeGreaterThanOrEqual(10)
    }
  })

  it('covers every spirit family in the picker', () => {
    for (const family of SPIRIT_FAMILIES) {
      const count = INGREDIENTS.filter((i) => i.family === family).length
      expect(count, family).toBeGreaterThan(0)
    }
  })
})
