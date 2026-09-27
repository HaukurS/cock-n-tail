import { ROLE_LABELS, type Role } from './types'

type Item = { name: string; role: Role }

export function comboText({
  name,
  items,
  notes,
}: {
  name?: string
  items: Item[]
  notes?: string
}): string {
  const width = Math.max(...items.map((i) => ROLE_LABELS[i.role].length))
  const lines = items.map((i) => `${ROLE_LABELS[i.role].padEnd(width)}  ${i.name}`)

  return [
    name ? `${name}\n` : '',
    lines.join('\n'),
    notes?.trim() ? `\nNotes\n${notes.trim()}` : '',
    `\n— Cock 'n Tail`,
  ]
    .filter(Boolean)
    .join('\n')
}

export type ShareResult = 'shared' | 'copied' | 'failed'

export async function shareOrCopy(text: string, title?: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (error) {
      // A user dismissing the share sheet is not a failure worth reporting.
      if (error instanceof Error && error.name === 'AbortError') return 'shared'
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
