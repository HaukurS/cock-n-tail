/**
 * iOS Safari does not implement the Vibration API, so this is a no-op on
 * iPhone. Motion and sound carry the tactility there; this upgrades the
 * experience on Android without the UI needing to know either way.
 */

const PATTERNS = {
  tick: 8,
  lock: 18,
  discard: [0, 10, 30, 10],
  shuffle: [0, 14, 45, 14, 45, 24],
  save: [0, 28, 55, 40],
} satisfies Record<string, number | number[]>

export type HapticPattern = keyof typeof PATTERNS

export function haptic(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(PATTERNS[pattern])
  } catch {
    // Some browsers throw when the document has never been interacted with.
  }
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}
