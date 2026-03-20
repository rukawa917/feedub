/**
 * Channel color utility for visual mapping
 *
 * Provides deterministic color assignment for channels based on channel ID.
 * Same channel ID always gets the same color (hash-based).
 */

export interface ChannelColorScheme {
  bg: string
  text: string
  border: string
}

/**
 * 8 distinct, accessible colors for channel pills
 * Each color has bg, text, and border variants for consistent styling
 */
const CHANNEL_COLORS: ChannelColorScheme[] = [
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
]

/**
 * Simple hash function to convert string to number
 * Produces consistent output for the same input
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a consistent color scheme for a channel
 *
 * @param channelId - Unique channel identifier
 * @returns Color scheme with bg, text, and border Tailwind classes
 */
export function getChannelColor(channelId: string): ChannelColorScheme {
  const index = hashString(channelId) % CHANNEL_COLORS.length
  return CHANNEL_COLORS[index]
}
