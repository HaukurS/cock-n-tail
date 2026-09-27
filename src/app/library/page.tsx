'use client'

import { useMemo, useState } from 'react'
import { PinIcon, PlusIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { Chip } from '@/components/ui'
import { haptic } from '@/lib/haptics'
import { INGREDIENT_SEED, search } from '@/lib/ingredients'
import { useHydrated, useStore } from '@/lib/store'
import { ROLES, ROLE_LABELS, type Ingredient, type Role } from '@/lib/types'
import { AddIngredient } from './add-ingredient'

export default function LibraryPage() {
  const hydrated = useHydrated()
  const custom = useStore((s) => s.custom)
  const ownedIds = useStore((s) => s.ownedIds)
  const pinnedIds = useStore((s) => s.pinnedIds)
  const toggleOwned = useStore((s) => s.toggleOwned)
  const togglePin = useStore((s) => s.togglePin)
  const removeCustom = useStore((s) => s.removeCustom)

  const [query, setQuery] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [adding, setAdding] = useState(false)

  const pool = useMemo(() => [...INGREDIENT_SEED, ...custom], [custom])

  const results = useMemo(() => {
    let list = search(pool, query)
    if (role) list = list.filter((i) => i.role === role)
    if (ownedOnly) list = list.filter((i) => ownedIds.includes(i.id))
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [pool, query, role, ownedOnly, ownedIds])

  const customIds = useMemo(() => new Set(custom.map((c) => c.id)), [custom])

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[1.75rem] leading-none">Library</h1>
          <button
            type="button"
            onClick={() => {
              haptic('tick')
              setAdding(true)
            }}
            aria-label="Add an ingredient"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted active:bg-surface-sunk"
          >
            <PlusIcon className="size-4" />
            Add
          </button>
        </div>
      </header>

      <div className="sticky top-0 z-30 space-y-3 border-b border-line bg-bg/90 px-4 pb-3 pt-1 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <SearchIcon className="size-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, category or flavour"
            className="w-full bg-transparent py-2.5 text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={!role && !ownedOnly} onClick={() => { setRole(null); setOwnedOnly(false) }}>
            All
          </Chip>
          <Chip active={ownedOnly} onClick={() => setOwnedOnly((o) => !o)}>
            My bar {hydrated && ownedIds.length > 0 ? ownedIds.length : ''}
          </Chip>
          {ROLES.map((r) => (
            <Chip key={r} active={role === r} onClick={() => setRole(role === r ? null : r)}>
              {ROLE_LABELS[r]}
            </Chip>
          ))}
        </div>
      </div>

      {!hydrated ? null : (
        <>
          <p className="px-5 pt-3 text-xs text-muted">
            {results.length} ingredient{results.length === 1 ? '' : 's'}
            {pinnedIds.length > 0 && ` · ${pinnedIds.length} pinned into every shuffle`}
          </p>

          <ul className="flex flex-col divide-y divide-line px-1 pb-6">
            {results.map((ingredient) => (
              <Row
                key={ingredient.id}
                ingredient={ingredient}
                owned={ownedIds.includes(ingredient.id)}
                pinned={pinnedIds.includes(ingredient.id)}
                isCustom={customIds.has(ingredient.id)}
                onToggleOwned={() => {
                  haptic('tick')
                  toggleOwned(ingredient.id)
                }}
                onTogglePin={() => {
                  haptic('lock')
                  togglePin(ingredient.id)
                }}
                onRemove={() => {
                  haptic('discard')
                  removeCustom(ingredient.id)
                }}
              />
            ))}
          </ul>

          {results.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 px-10 text-center">
              <p className="font-display text-2xl">No matches</p>
              <p className="text-sm text-muted">Try a different search, or add it yourself.</p>
            </div>
          )}
        </>
      )}

      <AddIngredient open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

function Row({
  ingredient,
  owned,
  pinned,
  isCustom,
  onToggleOwned,
  onTogglePin,
  onRemove,
}: {
  ingredient: Ingredient
  owned: boolean
  pinned: boolean
  isCustom: boolean
  onToggleOwned: () => void
  onTogglePin: () => void
  onRemove: () => void
}) {
  return (
    <li className="flex items-center gap-2 px-3">
      <button
        type="button"
        onClick={onToggleOwned}
        aria-pressed={owned}
        aria-label={`${owned ? 'Remove from' : 'Add to'} my bar: ${ingredient.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
      >
        <span
          className={`size-2 shrink-0 rounded-full transition-colors ${
            owned ? 'bg-accent' : 'bg-line'
          }`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem]">{ingredient.name}</span>
          <span className="block truncate text-xs text-muted">
            {ROLE_LABELS[ingredient.role]} · {ingredient.flavorTags.join(' · ')}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onTogglePin}
        aria-pressed={pinned}
        aria-label={`${pinned ? 'Unpin' : 'Pin'} ${ingredient.name}`}
        className={`rounded-full p-2 transition-colors ${
          pinned ? 'text-accent' : 'text-muted/40'
        }`}
      >
        <PinIcon className="size-[1.125rem]" />
      </button>

      {isCustom && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Delete ${ingredient.name}`}
          className="rounded-full p-2 text-muted/40"
        >
          <TrashIcon className="size-[1.125rem]" />
        </button>
      )}
    </li>
  )
}
