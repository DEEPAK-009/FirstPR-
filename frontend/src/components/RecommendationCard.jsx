const formatRelativeTime = (dateString) => {
  if (!dateString) {
    return 'Unknown date'
  }

  const openedTime = new Date(dateString).getTime()
  const diff = Date.now() - openedTime

  if (Number.isNaN(openedTime) || diff < 0) {
    return 'Unknown date'
  }

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / minute))}m ago`
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`
  }

  if (diff < week) {
    return `${Math.round(diff / day)}d ago`
  }

  return `${Math.round(diff / week)}w ago`
}

const previewText = (text) => {
  if (!text) {
    return 'AI explanation unavailable for this issue.'
  }

  const cleanedText = text
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleanedText.length > 190
    ? `${cleanedText.slice(0, 190).trim()}...`
    : cleanedText
}

function RecommendationCard({ issue, onOpen }) {
  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_144px] sm:items-start">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-400">
            {issue.repo}
          </p>
          <h3
            className="mt-2 max-w-full break-all text-xl font-semibold leading-snug text-slate-700 sm:pr-4 sm:text-2xl"
            style={{ overflowWrap: 'anywhere' }}
          >
            {issue.title}
          </h3>
        </div>

        <div className="w-full sm:justify-self-end sm:text-right">
          <div className="text-sm font-semibold text-sky-600">
            <span>{Math.round((issue.confidence || 0) * 100)}% Match</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 sm:ml-auto sm:max-w-[140px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-400"
              style={{ width: `${Math.round((issue.confidence || 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {issue.labels.slice(0, 3).map((label) => (
          <span
            key={label}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            {label}
          </span>
        ))}
      </div>

      <p className="mt-5 text-base leading-8 text-slate-600">
        {previewText(issue.explanation)}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span>{formatRelativeTime(issue.openedAt)}</span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(issue)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Review AI Insights
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  )
}

export default RecommendationCard
