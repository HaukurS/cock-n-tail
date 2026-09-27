export const ROLES = [
  'base',
  'modifier',
  'acid',
  'sweet',
  'aromatic',
  'hero',
  'texture',
  'lengthener',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  base: 'Base spirit',
  modifier: 'Modifier',
  acid: 'Acid',
  sweet: 'Sweetener',
  aromatic: 'Aromatic',
  hero: 'Hero flavour',
  texture: 'Texture',
  lengthener: 'Lengthener',
}

/**
 * Controlled vocabulary. A free-form tag list drifts into synonyms
 * ("citrusy"/"citrus"/"zesty") which silently breaks affinity matching.
 */
export const FLAVOR_TAGS = [
  'anise',
  'astringent',
  'berry',
  'bitter',
  'boozy',
  'briny',
  'bright',
  'caramel',
  'chocolate',
  'citrus',
  'coffee',
  'creamy',
  'dry',
  'earthy',
  'fatty',
  'fermented',
  'floral',
  'fruity',
  'funky',
  'grassy',
  'herbal',
  'honeyed',
  'juicy',
  'medicinal',
  'melon',
  'minty',
  'nutty',
  'orchard',
  'peppery',
  'resinous',
  'rich',
  'roasted',
  'salty',
  'savoury',
  'smoky',
  'sour',
  'spiced',
  'stone-fruit',
  'sweet',
  'tannic',
  'tart',
  'tropical',
  'umami',
  'vegetal',
  'woody',
] as const

export type FlavorTag = (typeof FLAVOR_TAGS)[number]

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
export type Season = (typeof SEASONS)[number]

export const THEMES = [
  'nordic',
  'tropical',
  'tiki',
  'dessert',
  'low-abv',
  'savoury',
  'aperitivo',
  'classic',
  'festive',
] as const
export type Theme = (typeof THEMES)[number]

/**
 * Families for the base-spirit picker. Kept separate from `category`
 * because the picker needs a short, stable list while categories stay granular.
 */
export const SPIRIT_FAMILIES = [
  'gin',
  'vodka',
  'whisky',
  'rum',
  'agave',
  'brandy',
  'aquavit',
  'other',
] as const
export type SpiritFamily = (typeof SPIRIT_FAMILIES)[number]

export type Ingredient = {
  id: string
  name: string
  role: Role
  /** Roles this can credibly stand in for — lemon is an acid but can play hero. */
  altRoles?: Role[]
  category: string
  flavorTags: FlavorTag[]
  /** Only set on `base` ingredients; drives the spirit picker. */
  family?: SpiritFamily
  season?: Season[]
  theme?: Theme[]
  /** Requires prep before service: shrubs, fat-washes, tinctures, cordials. */
  house?: boolean
}

/** Every role an ingredient can occupy. */
export function rolesOf(ingredient: Ingredient): Role[] {
  return [ingredient.role, ...(ingredient.altRoles ?? [])]
}

export function canFill(ingredient: Ingredient, role: Role): boolean {
  return ingredient.role === role || !!ingredient.altRoles?.includes(role)
}
