'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronIcon, ShareIcon, TrashIcon } from '@/components/icons'
import { haptic } from '@/lib/haptics'
import { comboText, shareOrCopy } from '@/lib/share'
import { useHydrated, useStore, type SavedCombo } from '@/lib/store'
import { ROLE_LABELS } from '@/lib/types'

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SavedRow({ combo }: { combo: SavedCombo }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const updateSaved = useStore((s) => s.updateSaved)
  const deleteSaved = useStore((s) => s.deleteSaved)
  const loadSaved = useStore((s) => s.loadSaved)

  async function handleShare() {
    haptic('tick')
    const result = await shareOrCopy(
      comboText({ name: combo.name, items: combo.items, notes: combo.notes }),
      combo.name,
    )
    setStatus(result === 'copied' ? 'Copied' : result === 'failed' ? "Couldn't share" : null)
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => {
          haptic('tick')
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.375rem] leading-tight">{combo.name}</span>
          <span className="mt-1 block text-[0.8125rem] text-muted">
            {combo.items.map((i) => i.name).join(' · ')}
          </span>
          <span className="mt-1 block text-xs text-muted/80">{formatDate(combo.createdAt)}</span>
        </span>
        <ChevronIcon
          className={`mt-1 size-4 shrink-0 text-muted transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
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
            <div className="space-y-3 border-t border-line px-4 py-4">
              <dl className="space-y-1.5">
                {combo.items.map((item) => (
                  <div key={item.id} className="flex items-baseline gap-3 text-sm">
                    <dt className="w-28 shrink-0 text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
                      {ROLE_LABELS[item.role]}
                    </dt>
                    <dd className="min-w-0">{item.name}</dd>
                  </div>
                ))}
              </dl>

              <textarea
                value={combo.notes}
                onChange={(e) => updateSaved(combo.id, { notes: e.target.value })}
                rows={4}
                placeholder="Ratios, method, what to try next…"
                className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
              />

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  onClick={() => {
                    haptic('lock')
                    loadSaved(combo.id)
                  }}
                  className="flex-1 rounded-xl bg-accent px-3 py-2.5 text-center text-sm font-medium text-bg"
                >
                  Open in shuffle
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share"
                  className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-sm text-muted"
                >
                  <ShareIcon className="size-4" />
                  {status}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic('discard')
                    deleteSaved(combo.id)
                  }}
                  aria-label={`Delete ${combo.name}`}
                  className="rounded-xl border border-line p-2.5 text-muted"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export default function SavedPage() {
  const hydrated = useHydrated()
  const saved = useStore((s) => s.saved)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <h1 className="font-display text-[1.75rem] leading-none">Saved</h1>
      </header>

      {!hydrated ? null : saved.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-10 text-center">
          <p className="font-display text-2xl">Nothing saved yet</p>
          <p className="text-sm text-muted">
            When a shuffle throws up something worth chasing, hit Save and it lands here with
            your notes.
          </p>
          <Link href="/" className="mt-2 text-sm text-accent">
            Go shuffle
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 px-4 pb-6">
          {saved.map((combo) => (
            <SavedRow key={combo.id} combo={combo} />
          ))}
        </ul>
      )}
    </div>
  )
}
