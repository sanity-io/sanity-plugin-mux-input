/**
 * Rounds the numeric part of a px string to the nearest integer.
 * Returns undefined if the value is not a valid px string or not a finite number.
 * Avoids sending 0px (and JS -0); snaps to ±1 instead.
 */
export function roundPxString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed.endsWith('px')) return undefined
  const n = Number(trimmed.slice(0, -2))
  if (!Number.isFinite(n)) return undefined
  let rounded = Math.round(n)
  // Avoid sending 0px (and JS -0); keep sign when negative.
  if (rounded === 0) rounded = n < 0 ? -1 : 1
  return `${rounded}px`
}
