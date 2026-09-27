'use client'

import { useState } from 'react'
import { haptic } from '@/lib/haptics'
import { comboText, shareOrCopy } from '@/lib/share'
import type { Slot } from '@/lib/shuffle'
import { useStore } from '@/lib/store'
import { CloseIcon, ShareIcon } from './icons'
import { Sheet } from './sheet'

export function SaveSheet({
  slots,
  open,
  onClose,
}: {
  slots: Slot[]
  open: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Save this set">
      <SaveForm slots={slots} onClose={onClose} />
    </Sheet>
  )
}

/** Mounted only while the sheet is open, so every open starts blank
 *  without an effect reaching in to reset it. */
function SaveForm({ slots, onClose }: { slots: Slot[]; onClose: () => void }) {
  const saveCurrent = useStore((s) => s.saveCurrent)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const items = slots.map((s) => ({ name: s.ingredient.name, role: s.role }))

  async function handleShare() {
    haptic('tick')
    const result = await shareOrCopy(comboText({ name, items, notes }), name || 'Cocktail idea')
    setStatus(result === 'copied' ? 'Copied' : result === 'failed' ? "Couldn't share" : null)
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="font-display text-2xl">Save this set</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-muted active:bg-surface-sunk"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <p className="px-5 pt-1 text-[0.8125rem] text-muted">
        {items.map((i) => i.name).join(' · ')}
      </p>

      <div className="space-y-3 px-5 pt-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name it — caraway / sherry idea"
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Ratios, method, what to try next…"
          className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-muted active:bg-surface-sunk"
        >
          <ShareIcon className="size-4" />
          {status ?? 'Share'}
        </button>
        <button
          type="button"
          onClick={() => {
            haptic('save')
            saveCurrent(name, notes)
            onClose()
          }}
          className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-bg active:opacity-90"
        >
          Save
        </button>
      </div>
    </>
  )
}
