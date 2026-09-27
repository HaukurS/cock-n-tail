'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Controls } from '@/components/controls'
import { UndoIcon } from '@/components/icons'
import { SaveSheet } from '@/components/save-sheet'
import { SlotCard } from '@/components/slot-card'
import { haptic } from '@/lib/haptics'
import { INGREDIENT_SEED } from '@/lib/ingredients'
import { useHydrated, useStore } from '@/lib/store'

export default function ShufflePage() {
  const hydrated = useHydrated()
  const slots = useStore((s) => s.slots)
  const custom = useStore((s) => s.custom)
  const history = useStore((s) => s.history)
  const shuffle = useStore((s) => s.shuffle)
  const reroll = useStore((s) => s.reroll)
  const toggleLock = useStore((s) => s.toggleLock)
  const clearLocks = useStore((s) => s.clearLocks)
  const stepBack = useStore((s) => s.stepBack)
  const resetControls = useStore((s) => s.resetControls)
  const [saveOpen, setSaveOpen] = useState(false)

  const pool = useMemo(() => [...INGREDIENT_SEED, ...custom], [custom])

  // First visit lands on an empty store, and an empty screen teaches nothing.
  useEffect(() => {
    if (hydrated && slots.length === 0) shuffle()
  }, [hydrated, slots.length, shuffle])

  const lockedCount = slots.filter((s) => s.locked).length

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="font-display text-2xl text-muted">Cock &apos;n Tail</span>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <h1 className="font-display text-[1.75rem] leading-none">Cock &apos;n Tail</h1>
        <button
          type="button"
          onClick={() => {
            haptic('tick')
            stepBack()
          }}
          disabled={history.length === 0}
          aria-label="Back to the previous set"
          className="rounded-full p-2 text-muted transition-opacity active:bg-surface-sunk disabled:opacity-25"
        >
          <UndoIcon className="size-5" />
        </button>
      </header>

      <Controls pool={pool} />

      {slots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 pb-32 text-center">
          <p className="font-display text-2xl">Nothing fits</p>
          <p className="text-sm text-muted">
            Your filters rule out every ingredient. Loosen them, or mark what you actually
            have in the Library.
          </p>
          <button
            type="button"
            onClick={() => {
              haptic('tick')
              resetControls()
              shuffle()
            }}
            className="text-sm text-accent"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-2.5 px-4 pt-4 pb-32">
          <AnimatePresence initial={false} mode="popLayout">
            {slots.map((slot, index) => (
              <SlotCard
                key={`${slot.role}-${index}`}
                slot={slot}
                index={index}
                onToggleLock={toggleLock}
                onReroll={reroll}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Sits directly above the tab bar, which is itself fixed. */}
      <div
        className="fixed inset-x-0 z-30 mx-auto max-w-lg border-t border-line bg-bg/85 px-4 py-3 backdrop-blur-xl"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence initial={false}>
          {lockedCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 text-xs text-muted">
                <span>{lockedCount} held · shuffle rerolls the rest</span>
                <button
                  type="button"
                  onClick={() => {
                    haptic('tick')
                    clearLocks()
                  }}
                  className="text-accent"
                >
                  Release all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic('shuffle')
              shuffle()
            }}
            className="flex-1 rounded-2xl bg-accent py-4 text-[0.9375rem] font-medium tracking-wide text-bg"
          >
            Shuffle
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic('tick')
              setSaveOpen(true)
            }}
            disabled={slots.length === 0}
            className="rounded-2xl border border-line px-5 py-4 text-[0.9375rem] text-ink disabled:opacity-40"
          >
            Save
          </motion.button>
        </div>
      </div>

      <SaveSheet slots={slots} open={saveOpen} onClose={() => setSaveOpen(false)} />
    </div>
  )
}
