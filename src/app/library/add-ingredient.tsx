'use client'

import { useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { Sheet } from '@/components/sheet'
import { Chip, FieldLabel, Toggle } from '@/components/ui'
import { haptic } from '@/lib/haptics'
import { useStore } from '@/lib/store'
import {
  FLAVOR_TAGS,
  ROLES,
  ROLE_LABELS,
  SPIRIT_FAMILIES,
  type FlavorTag,
  type Ingredient,
  type Role,
  type SpiritFamily,
} from '@/lib/types'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function AddIngredient({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Add an ingredient">
      <AddForm onClose={onClose} />
    </Sheet>
  )
}

function AddForm({ onClose }: { onClose: () => void }) {
  const addCustom = useStore((s) => s.addCustom)
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('hero')
  const [family, setFamily] = useState<SpiritFamily>('other')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<FlavorTag[]>([])
  const [house, setHouse] = useState(false)

  const valid = name.trim().length > 0 && tags.length > 0

  function handleAdd() {
    if (!valid) return
    haptic('save')
    const ingredient: Ingredient = {
      // Prefixed so a custom entry can never shadow a seed ingredient.
      id: `custom-${slugify(name)}`,
      name: name.trim(),
      role,
      category: category.trim() || 'custom',
      flavorTags: tags,
      ...(role === 'base' ? { family } : {}),
      ...(house ? { house: true } : {}),
    }
    addCustom(ingredient)
    onClose()
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="font-display text-2xl">Add an ingredient</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-muted active:bg-surface-sunk"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pt-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
        />

        <div>
          <FieldLabel>Role — the job it does in a drink</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <Chip key={r} active={role === r} onClick={() => setRole(r)}>
                {ROLE_LABELS[r]}
              </Chip>
            ))}
          </div>
        </div>

        {role === 'base' && (
          <div>
            <FieldLabel>Spirit family</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {SPIRIT_FAMILIES.map((f) => (
                <Chip key={f} active={family === f} onClick={() => setFamily(f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div>
          <FieldLabel>Category</FieldLabel>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. shrub, berry, seaweed"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
          />
        </div>

        <div>
          <FieldLabel>Flavour tags {tags.length > 0 && `· ${tags.length}`}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag) => (
              <Chip
                key={tag}
                active={tags.includes(tag)}
                onClick={() =>
                  setTags((current) =>
                    current.includes(tag)
                      ? current.filter((t) => t !== tag)
                      : [...current, tag],
                  )
                }
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>

        <div className="border-y border-line">
          <Toggle
            label="Needs prep"
            hint="Shrubs, tinctures, fat-washes and the like"
            checked={house}
            onChange={setHouse}
          />
        </div>
      </div>

      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!valid}
          className="w-full rounded-xl bg-accent px-4 py-3.5 text-sm font-medium text-bg disabled:opacity-40"
        >
          {valid ? 'Add to library' : 'Name and at least one tag'}
        </button>
      </div>
    </>
  )
}
