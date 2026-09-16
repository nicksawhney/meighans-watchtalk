/** Long-form date, e.g. "16 September 2026". Matches the prototype's en-GB style. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Trim flattened body text down to a card excerpt, cutting on a word boundary
 * so we never end mid-word. Returns null when there is nothing to show.
 */
export function plainTextExcerpt(text: string | null | undefined, max: number): string | null {
  const clean = text?.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  if (clean.length <= max) return clean

  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—-]$/, '')}…`
}
