import { useState, useEffect, useCallback } from 'react'
import { saveBookmark } from '../api/bookmarks'
import { explainIssue } from '../api/issues'
import { isRealExplanation } from '../utils/explanation'

const renderStructuredExplanation = (text) => {
  if (!text) return 'AI explanation unavailable for this issue.'

  const lines = text.split('\n')
  return lines.map((rawLine, idx) => {
    const line = rawLine.trim()
    if (!line) return <div key={idx} className="h-1.5" />

    // Bold headers like **What this issue is about:**
    if (line.startsWith('**') && line.endsWith('**')) {
      const clean = line.replace(/\*\*/g, '')
      return (
        <h4 key={idx} className="pt-2 pb-0.5 text-xs font-extrabold uppercase tracking-wider text-sky-900">
          {clean}
        </h4>
      )
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const content = line.replace(/^[-*•]\s+/, '')
      const parts = content.split(/(\*\*.*?\*\*)/g)
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-slate-700">
          <span className="text-sky-500 font-bold leading-none mt-1.5">•</span>
          <span className="flex-1 leading-relaxed">
            {parts.map((p, pIdx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pIdx} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
              ) : (
                p
              )
            )}
          </span>
        </div>
      )
    }

    // Numbered steps: 1. ...
    const numMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      const num = numMatch[1]
      const content = numMatch[2]
      const parts = content.split(/(\*\*.*?\*\*)/g)
      return (
        <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1 text-slate-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-800 mt-0.5">
            {num}
          </span>
          <span className="flex-1 leading-relaxed">
            {parts.map((p, pIdx) =>
              p.startsWith('**') && p.endsWith('**') ? (
                <strong key={pIdx} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
              ) : (
                p
              )
            )}
          </span>
        </div>
      )
    }

    // Standard paragraphs with inline **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return (
      <p key={idx} className="leading-relaxed text-slate-700">
        {parts.map((p, pIdx) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={pIdx} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
          ) : (
            p
          )
        )}
      </p>
    )
  })
}

function RecommendationDrawer({ issue, onClose, onExplanationGenerated }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [explanation, setExplanation] = useState(
    issue && isRealExplanation(issue.explanation, issue.matchReason)
      ? issue.explanation
      : null
  )
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [explanationError, setExplanationError] = useState(null)

  const fetchExplanation = (targetIssue = issue) => {
    if (!targetIssue) return

    setLoadingExplanation(true)
    setExplanationError(null)

    explainIssue({
      title: targetIssue.title,
      body: targetIssue.originalBody,
      labels: targetIssue.labels
    })
      .then((data) => {
        const text = data.explanation || 'Explanation not available'
        setExplanation(text)
        if (onExplanationGenerated) {
          onExplanationGenerated(targetIssue.url, text)
        }
      })
      .catch((err) => {
        setExplanationError(
          err.response?.data?.error || 'Unable to generate AI explanation right now.'
        )
      })
      .finally(() => {
        setLoadingExplanation(false)
      })
  }

  useEffect(() => {
    if (!issue) return

    if (isRealExplanation(issue.explanation, issue.matchReason)) {
      setExplanation(issue.explanation)
      setLoadingExplanation(false)
      setExplanationError(null)
      return
    }

    setExplanation(null)
    setLoadingExplanation(false)
    setExplanationError(null)
  }, [issue?.url, issue?.explanation, issue?.matchReason])

  if (!issue) {
    return null
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await saveBookmark({
        ...issue,
        explanation: explanation || issue.explanation
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save bookmark:', err)
    } finally {
      setSaving(false)
    }
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
                onClick={handleSave}
                disabled={saving || saved}
                className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                  saved
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                } disabled:cursor-not-allowed`}
              >
                {saving ? 'Saving...' : saved ? 'Saved! ✓' : 'Save for Later'}
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

        <div className="space-y-6 px-6 py-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 break-words sm:text-2xl">
              {issue.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{issue.repo}</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-sky-600">
                {Math.round((issue.confidence || 0) * 100)}% match
              </span>
            </div>
          </div>

          <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                AI Action Plan & Key Details
              </p>
              {loadingExplanation ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 animate-pulse">
                  <svg className="h-3 w-3 animate-spin text-amber-700" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyzing with Groq...
                </span>
              ) : isRealExplanation(explanation, issue.matchReason) ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchExplanation(issue)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 transition cursor-pointer"
                    title="Regenerate AI breakdown"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 21h5v-5" />
                    </svg>
                    Regenerate
                  </button>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                    On-Demand AI
                  </span>
                </div>
              ) : (
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  On-Demand AI
                </span>
              )}
            </div>

            {loadingExplanation ? (
              <div className="space-y-3 py-3 animate-pulse">
                <div className="h-4 bg-sky-200/50 rounded-md w-3/4"></div>
                <div className="space-y-2 pt-1">
                  <div className="h-3 bg-sky-200/40 rounded-md w-full"></div>
                  <div className="h-3 bg-sky-200/40 rounded-md w-5/6"></div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-sky-200/30 rounded-md w-11/12"></div>
                  <div className="h-3 bg-sky-200/30 rounded-md w-4/6"></div>
                </div>
              </div>
            ) : explanationError ? (
              <div className="py-2 text-xs text-rose-600">
                {explanationError}
                <button
                  type="button"
                  onClick={() => fetchExplanation(issue)}
                  className="ml-2 font-bold underline hover:text-rose-700 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : isRealExplanation(explanation, issue.matchReason) ? (
              <div className="space-y-1 text-sm text-slate-700">
                {renderStructuredExplanation(explanation)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ready for a structured action plan?
                </h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Generate a points + paragraphs breakdown with key details and step-by-step resolution guidance.
                </p>
                <button
                  type="button"
                  onClick={() => fetchExplanation(issue)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 hover:shadow active:scale-95 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
                  </svg>
                  Generate AI Insights
                </button>
              </div>
            )}
          </section>

          <section>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Why It Matches You
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {issue.matchReason}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {issue.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Original Maintainer Description
              </p>
              <span className="text-[11px] font-medium text-slate-400">
                Full Context
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
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
