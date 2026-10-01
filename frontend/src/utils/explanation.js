export const isRealExplanation = (text, matchReason) => {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed === 'Explanation not available') return false
  if (
    trimmed.includes("Click 'Review AI Insights'") ||
    trimmed.includes('Click "Review AI Insights"')
  ) {
    return false
  }
  // Filter out legacy unformatted summaries
  if (
    trimmed.startsWith('What the issue means') ||
    trimmed.startsWith('1. What this issue means') ||
    trimmed.startsWith('What this issue means')
  ) {
    return false
  }
  if (matchReason && trimmed === matchReason.trim()) {
    return false
  }
  if (
    trimmed.startsWith('Matches your') &&
    (trimmed.includes('skills based on') ||
      trimmed.includes('skills and') ||
      trimmed.includes('skills through'))
  ) {
    return false
  }
  return true
}
