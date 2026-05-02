function ResultsHeader({
  total,
  sortBy,
  onSortChange,
  hasSearched,
  loading,
}) {
  const subtitle = loading
    ? 'Scanning GitHub, scoring issues, and generating AI explanations.'
    : hasSearched
      ? `Showing ${total} recommended issues based on your skills and ML match confidence.`
      : 'Search with your skills to find beginner-friendly GitHub issues matched by ML confidence.'

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">
          OSS Scout
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Top Recommended Issues
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
          {subtitle}
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-500">
        <span>Sort by:</span>
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 outline-none transition focus:border-sky-400"
        >
          <option value="highest">Highest Match</option>
          <option value="latest">Latest</option>
          <option value="comments">Fewest Comments</option>
        </select>
      </label>
    </div>
  )
}

export default ResultsHeader
