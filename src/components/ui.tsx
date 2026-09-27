'use client'

import { haptic } from '@/lib/haptics'
import { CheckIcon } from './icons'

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic('tick')
        onClick()
      }}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors duration-200 ${
        active
          ? 'border-accent bg-accent text-bg'
          : 'border-line bg-surface text-muted active:bg-surface-sunk'
      }`}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        haptic('tick')
        onChange(!checked)
      }}
      className="flex w-full items-center justify-between gap-3 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-surface shadow-sm transition-[left] duration-200 ${
            checked ? 'left-[1.125rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted">
      {children}
    </span>
  )
}

export function SelectableRow({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-sunk"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          active ? 'border-accent bg-accent text-bg' : 'border-line'
        }`}
      >
        {active && <CheckIcon className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}
