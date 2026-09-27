'use client'

import { AnimatePresence, motion } from 'motion/react'
import { haptic } from '@/lib/haptics'
import type { Slot } from '@/lib/shuffle'
import { ROLE_LABELS } from '@/lib/types'
import { LockIcon, RerollIcon, UnlockIcon } from './icons'

type Props = {
  slot: Slot
  index: number
  onToggleLock: (index: number) => void
  onReroll: (index: number) => void
}

export function SlotCard({ slot, index, onToggleLock, onReroll }: Props) {
  const { ingredient, role, locked, wild } = slot

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={`group relative flex items-stretch overflow-hidden rounded-2xl border transition-colors duration-300 ${
        locked
          ? 'border-accent/60 bg-accent-soft'
          : 'border-line bg-surface'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          haptic(locked ? 'tick' : 'lock')
          onToggleLock(index)
        }}
        aria-pressed={locked}
        aria-label={`${locked ? 'Unlock' : 'Lock'} ${ingredient.name}`}
        className="flex-1 min-w-0 px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">
            {ROLE_LABELS[role]}
          </span>
          {wild && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-accent">
              wild
            </span>
          )}
        </span>

        {/* Clipped so a new ingredient rolls in like a reel rather than popping. */}
        <span className="mt-0.5 block h-9 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ingredient.id}
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              exit={{ y: '-105%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="block font-display text-[1.75rem] leading-9 tracking-tight"
            >
              {ingredient.name}
            </motion.span>
          </AnimatePresence>
        </span>

        <span className="mt-1 block truncate text-[0.8125rem] text-muted">
          {ingredient.flavorTags.join(' · ')}
        </span>
      </button>

      <span className="flex shrink-0 flex-col items-center justify-center gap-1 pr-2.5">
        <span
          className={`transition-opacity duration-200 ${
            locked ? 'text-accent opacity-100' : 'text-muted opacity-40'
          }`}
        >
          {locked ? <LockIcon className="size-[1.125rem]" /> : <UnlockIcon className="size-[1.125rem]" />}
        </span>
        <button
          type="button"
          onClick={() => {
            haptic('discard')
            onReroll(index)
          }}
          disabled={locked}
          aria-label={`Discard ${ingredient.name} and draw another ${ROLE_LABELS[role].toLowerCase()}`}
          className="rounded-full p-2 text-muted transition-colors active:bg-surface-sunk disabled:opacity-25"
        >
          <RerollIcon className="size-[1.125rem]" />
        </button>
      </span>
    </motion.li>
  )
}
