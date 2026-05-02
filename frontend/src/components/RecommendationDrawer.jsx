function RecommendationDrawer({ issue, onClose }) {
  if (!issue) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        onClick={onClose}
        className="hidden flex-1 bg-slate-900/35 backdrop-blur-sm lg:block"
        aria-label="Close drawer"
      />

      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close drawer"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Save for Later
              </button>
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              {issue.title}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-lg text-slate-500">
              <span className="font-semibold text-slate-700">{issue.repo}</span>
              <span className="text-slate-300">•</span>
              <span>
                {Math.round((issue.confidence || 0) * 100)}% confidence
              </span>
            </div>
          </div>

          <section className="rounded-[2rem] border border-sky-100 bg-sky-50/80 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">
              AI Explanation
            </p>
            <p className="mt-4 whitespace-pre-line text-lg leading-9 text-slate-700">
              {issue.explanation}
            </p>
          </section>

          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Why It Matches You
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              {issue.matchReason}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {issue.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Original Description
            </p>
            <div className="mt-4 rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5">
              <pre className="whitespace-pre-wrap font-sans text-lg leading-8 text-slate-700">
                {issue.originalBody}
              </pre>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

export default RecommendationDrawer
