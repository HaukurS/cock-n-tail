'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { allCategories } from '@/lib/ingredients'
import { haptic } from '@/lib/haptics'
import { MAX_SIZE, MIN_SIZE } from '@/lib/shuffle'
import { useStore } from '@/lib/store'
import { SEASONS, SPIRIT_FAMILIES, THEMES, type Ingredient } from '@/lib/types'
import { ChevronIcon, SlidersIcon } from './icons'
import { Chip, FieldLabel, Toggle } from './ui'

const CHAOS_LABELS = [
  { max: 0, label: 'By the book' },
  { max: 25, label: 'Nudged' },
  { max: 60, label: 'Loose' },
  { max: 99, label: 'Unruly' },
  { max: 100, label: 'Anything goes' },
]

function chaosLabel(value: number): string {
  return CHAOS_LABELS.find((c) => value <= c.max)?.label ?? 'Loose'
}

export function Controls({ pool }: { pool: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const controls = useStore((s) => s.controls)
  const setControls = useStore((s) => s.setControls)
  const pinnedIds = useStore((s) => s.pinnedIds)
  const ownedCount = useStore((s) => s.ownedIds.length)
  const categories = allCategories(pool)

  const activeCount =
    (controls.family ? 1 : 0) +
    (controls.season ? 1 : 0) +
    (controls.theme ? 1 : 0) +
    (controls.chaos > 0 ? 1 : 0) +
    (controls.onlyOwned ? 1 : 0) +
    (controls.excludeHouse ? 1 : 0) +
    controls.excludedCategories.length +
    pinnedIds.length

  return (
    <section className="border-b border-line bg-surface">
      <button
        type="button"
        onClick={() => {
          haptic('tick')
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
      >
        <SlidersIcon className="size-[1.125rem] text-muted" />
        <span className="flex-1 text-sm">
          {controls.size} ingredients
          {controls.family ? ` · ${controls.family}` : ''}
          {controls.chaos > 0 ? ` · ${chaosLabel(controls.chaos).toLowerCase()}` : ''}
        </span>
        {activeCount > 0 && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            {activeCount}
          </span>
        )}
        <ChevronIcon
          className={`size-4 text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-5 pb-5">
              <div>
                <FieldLabel>Base spirit</FieldLabel>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
                  <Chip active={!controls.family} onClick={() => setControls({ family: null })}>
                    Any
                  </Chip>
                  {SPIRIT_FAMILIES.map((family) => (
                    <Chip
                      key={family}
                      active={controls.family === family}
                      onClick={() =>
                        setControls({ family: controls.family === family ? null : family })
                      }
                    >
                      {family}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Set size</FieldLabel>
                <div className="flex gap-2">
                  {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i).map(
                    (size) => (
                      <Chip
                        key={size}
                        active={controls.size === size}
                        onClick={() => setControls({ size })}
                      >
                        {size}
                      </Chip>
                    ),
                  )}
                </div>
              </div>

              <div>
                <FieldLabel>Chaos · {chaosLabel(controls.chaos)}</FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={controls.chaos}
                  onChange={(e) => setControls({ chaos: Number(e.target.value) })}
                  aria-label="Chaos"
                  className="h-6 w-full accent-[var(--accent)]"
                />
                <p className="text-xs text-muted">
                  At zero, every slot gets an ingredient that can actually do that job. Turn it
                  up to let things land where they shouldn&apos;t.
                </p>
              </div>

              <div>
                <FieldLabel>Season</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!controls.season} onClick={() => setControls({ season: null })}>
                    Any
                  </Chip>
                  {SEASONS.map((season) => (
                    <Chip
                      key={season}
                      active={controls.season === season}
                      onClick={() =>
                        setControls({ season: controls.season === season ? null : season })
                      }
                    >
                      {season}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Theme</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!controls.theme} onClick={() => setControls({ theme: null })}>
                    Any
                  </Chip>
                  {THEMES.map((theme) => (
                    <Chip
                      key={theme}
                      active={controls.theme === theme}
                      onClick={() =>
                        setControls({ theme: controls.theme === theme ? null : theme })
                      }
                    >
                      {theme}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-line border-y border-line">
                <Toggle
                  label="Only what's in my bar"
                  hint={
                    ownedCount > 0
                      ? `${ownedCount} ingredients marked`
                      : 'Mark ingredients in the Library first'
                  }
                  checked={controls.onlyOwned}
                  onChange={(onlyOwned) => setControls({ onlyOwned })}
                />
                <Toggle
                  label="Skip house preparations"
                  hint="Hides shrubs, tinctures, fat-washes and cordials"
                  checked={controls.excludeHouse}
                  onChange={(excludeHouse) => setControls({ excludeHouse })}
                />
              </div>

              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm">
                  <span>
                    Exclude categories
                    {controls.excludedCategories.length > 0 &&
                      ` · ${controls.excludedCategories.length}`}
                  </span>
                  <ChevronIcon className="size-4 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const excluded = controls.excludedCategories.includes(category)
                    return (
                      <Chip
                        key={category}
                        active={excluded}
                        onClick={() =>
                          setControls({
                            excludedCategories: excluded
                              ? controls.excludedCategories.filter((c) => c !== category)
                              : [...controls.excludedCategories, category],
                          })
                        }
                      >
                        {category}
                      </Chip>
                    )
                  })}
                </div>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
