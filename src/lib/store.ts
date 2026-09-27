import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INGREDIENT_SEED } from './ingredients'
import {
  DEFAULT_FILTERS,
  generateSet,
  rerollSlot,
  toggleLock as toggleSlotLock,
  type Filters,
  type Slot,
} from './shuffle'
import type { Ingredient, Role, Season, SpiritFamily, Theme } from './types'

/** User-facing knobs. Kept separate from `Filters` so pins and My Bar
 *  live in one place instead of being duplicated into every filter object. */
export type Controls = {
  size: number
  family: SpiritFamily | null
  excludedCategories: string[]
  season: Season | null
  theme: Theme | null
  chaos: number
  onlyOwned: boolean
  excludeHouse: boolean
}

const DEFAULT_CONTROLS: Controls = {
  size: 5,
  family: null,
  excludedCategories: [],
  season: null,
  theme: null,
  chaos: 0,
  onlyOwned: false,
  excludeHouse: false,
}

export type SavedCombo = {
  id: string
  name: string
  notes: string
  /** Name is snapshotted so a combo still reads correctly if the
   *  library later drops or renames an ingredient. */
  items: { id: string; name: string; role: Role }[]
  createdAt: number
}

type PersistedSlot = { id: string; role: Role; locked: boolean }

type State = {
  controls: Controls
  slots: Slot[]
  history: Slot[][]
  pinnedIds: string[]
  ownedIds: string[]
  custom: Ingredient[]
  saved: SavedCombo[]
}

type Actions = {
  pool: () => Ingredient[]
  filters: () => Filters
  shuffle: () => void
  reroll: (index: number, ignoreRole?: boolean) => void
  toggleLock: (index: number) => void
  clearLocks: () => void
  stepBack: () => void
  canStepBack: () => boolean
  setControls: (patch: Partial<Controls>) => void
  resetControls: () => void
  togglePin: (id: string) => void
  toggleOwned: (id: string) => void
  addCustom: (ingredient: Ingredient) => void
  removeCustom: (id: string) => void
  saveCurrent: (name: string, notes: string) => void
  updateSaved: (id: string, patch: Partial<Pick<SavedCombo, 'name' | 'notes'>>) => void
  deleteSaved: (id: string) => void
  loadSaved: (id: string) => void
}

const HISTORY_LIMIT = 30

function toPersistedSlot(slot: Slot): PersistedSlot {
  return { id: slot.ingredient.id, role: slot.role, locked: slot.locked }
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      controls: DEFAULT_CONTROLS,
      slots: [],
      history: [],
      pinnedIds: [],
      ownedIds: [],
      custom: [],
      saved: [],

      pool: () => [...INGREDIENT_SEED, ...get().custom],

      filters: () => {
        const { controls, pinnedIds, ownedIds } = get()
        return {
          ...DEFAULT_FILTERS,
          ...controls,
          pinnedIds,
          ownedIds,
        }
      },

      shuffle: () => {
        const { slots, history } = get()
        const next = generateSet({
          pool: get().pool(),
          filters: get().filters(),
          keep: slots,
        })
        set({
          slots: next,
          history: slots.length
            ? [...history, slots].slice(-HISTORY_LIMIT)
            : history,
        })
      },

      reroll: (index, ignoreRole = false) => {
        const { slots, history } = get()
        const next = rerollSlot({
          slots,
          index,
          pool: get().pool(),
          filters: get().filters(),
          ignoreRole,
        })
        if (next === slots) return
        set({ slots: next, history: [...history, slots].slice(-HISTORY_LIMIT) })
      },

      toggleLock: (index) => set({ slots: toggleSlotLock(get().slots, index) }),

      clearLocks: () =>
        set({ slots: get().slots.map((s) => ({ ...s, locked: false })) }),

      stepBack: () => {
        const { history } = get()
        const previous = history.at(-1)
        if (!previous) return
        set({ slots: previous, history: history.slice(0, -1) })
      },

      canStepBack: () => get().history.length > 0,

      setControls: (patch) => {
        set({ controls: { ...get().controls, ...patch } })
        // Size changes the skeleton, so the visible set must be rebuilt
        // or locked slots would sit against the wrong roles.
        if (patch.size !== undefined && get().slots.length) get().shuffle()
      },

      resetControls: () => set({ controls: DEFAULT_CONTROLS }),

      togglePin: (id) => {
        const { pinnedIds } = get()
        set({
          pinnedIds: pinnedIds.includes(id)
            ? pinnedIds.filter((p) => p !== id)
            : [...pinnedIds, id],
        })
      },

      toggleOwned: (id) => {
        const { ownedIds } = get()
        set({
          ownedIds: ownedIds.includes(id)
            ? ownedIds.filter((o) => o !== id)
            : [...ownedIds, id],
        })
      },

      addCustom: (ingredient) =>
        set({ custom: [...get().custom.filter((c) => c.id !== ingredient.id), ingredient] }),

      removeCustom: (id) =>
        set({
          custom: get().custom.filter((c) => c.id !== id),
          pinnedIds: get().pinnedIds.filter((p) => p !== id),
          ownedIds: get().ownedIds.filter((o) => o !== id),
        }),

      saveCurrent: (name, notes) => {
        const { slots, saved } = get()
        if (!slots.length) return
        const combo: SavedCombo = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: name.trim() || 'Untitled',
          notes,
          items: slots.map((s) => ({
            id: s.ingredient.id,
            name: s.ingredient.name,
            role: s.role,
          })),
          createdAt: Date.now(),
        }
        set({ saved: [combo, ...saved] })
      },

      updateSaved: (id, patch) =>
        set({
          saved: get().saved.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),

      deleteSaved: (id) => set({ saved: get().saved.filter((c) => c.id !== id) }),

      loadSaved: (id) => {
        const combo = get().saved.find((c) => c.id === id)
        if (!combo) return
        const pool = get().pool()
        const slots = combo.items
          .map((item) => {
            const ingredient = pool.find((i) => i.id === item.id)
            if (!ingredient) return null
            return { role: item.role, ingredient, locked: true, wild: false }
          })
          .filter((s): s is Slot => s !== null)
        if (!slots.length) return
        set({
          slots,
          controls: { ...get().controls, size: slots.length },
          history: [],
        })
      },
    }),
    {
      name: 'cock-n-tail',
      version: 1,
      partialize: (state) => ({
        controls: state.controls,
        pinnedIds: state.pinnedIds,
        ownedIds: state.ownedIds,
        custom: state.custom,
        saved: state.saved,
        slots: state.slots.map(toPersistedSlot),
      }),
      // Slots are stored as ingredient ids, so rehydration has to resolve
      // them against the current library rather than trusting stale copies.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Omit<Partial<State>, 'slots'> & {
          slots?: PersistedSlot[]
        }
        const pool = [...INGREDIENT_SEED, ...(saved.custom ?? [])]
        const slots = (saved.slots ?? [])
          .map((ref): Slot | null => {
            const ingredient = pool.find((i) => i.id === ref.id)
            if (!ingredient) return null
            return { role: ref.role, ingredient, locked: ref.locked, wild: false }
          })
          .filter((s): s is Slot => s !== null)

        return {
          ...current,
          ...saved,
          controls: { ...DEFAULT_CONTROLS, ...(saved.controls ?? {}) },
          slots,
          history: [],
        }
      },
    },
  ),
)

/**
 * Persisted state arrives after the first paint, so rendering it directly
 * would mismatch the server HTML. Screens wait on this before reading.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  )
}
