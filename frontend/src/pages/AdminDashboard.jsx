import { useEffect, useState } from 'react'
import { checkBackendHealth, recommendIssues } from '../api/issues'
import ConfidenceSlider from '../components/ConfidenceSlider'
import PaginationControls from '../components/PaginationControls'
import RecommendationCard from '../components/RecommendationCard'
import RecommendationDrawer from '../components/RecommendationDrawer'
import ResultsHeader from '../components/ResultsHeader'
import SkillsInput from '../components/SkillsInput'

const ITEMS_PER_PAGE = 10

function AdminDashboard() {
  const [status, setStatus] = useState('checking')
  const [skills, setSkills] = useState(['TypeScript', 'React'])
  const [skillInput, setSkillInput] = useState('')
  const [minConfidence, setMinConfidence] = useState(40)
  const [recommendations, setRecommendations] = useState([])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [sortBy, setSortBy] = useState('highest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isActive = true

    const checkBackend = async () => {
      try {
        const data = await checkBackendHealth()

        if (isActive) {
          setStatus(`connected to backend on port ${data.port}`)
        }
      } catch {
        if (isActive) {
          setStatus('backend unavailable')
        }
      }
    }

    checkBackend()

    return () => {
      isActive = false
    }
  }, [])

  const addSkills = (rawValue) => {
    const nextSkills = rawValue
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)

    if (nextSkills.length === 0) {
      return
    }

    setSkills((currentSkills) => {
      const mergedSkills = [...currentSkills]

      nextSkills.forEach((skill) => {
        if (!mergedSkills.includes(skill)) {
          mergedSkills.push(skill)
        }
      })

      return mergedSkills
    })

    setSkillInput('')
  }

  const handleSearch = async () => {
    if (skills.length === 0) {
      setError('Add at least one skill before searching.')
      return
    }

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const data = await recommendIssues({
        skills,
        minConfidence,
      })

      setRecommendations(data.issues || [])
      setCurrentPage(1)
      setSelectedIssue(null)
    } catch (requestError) {
      const nextError =
        requestError.response?.data?.error ||
        'Unable to fetch recommendations right now.'

      setRecommendations([])
      setCurrentPage(1)
      setSelectedIssue(null)
      setError(nextError)
    } finally {
      setLoading(false)
    }
  }

  const sortedRecommendations = [...recommendations].sort((left, right) => {
    if (sortBy === 'latest') {
      return new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime()
    }

    if (sortBy === 'comments') {
      return (left.comments || 0) - (right.comments || 0)
    }

    return (right.confidence || 0) - (left.confidence || 0)
  })

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRecommendations.length / ITEMS_PER_PAGE)
  )
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const paginatedRecommendations = sortedRecommendations.slice(
    pageStartIndex,
    pageStartIndex + ITEMS_PER_PAGE
  )

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_36%),linear-gradient(180deg,_#f8fbff_0%,_#f2f6fc_100%)] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-400 shadow-lg shadow-sky-200">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M2 12h20" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-900">
                  FirstPR
                </p>
                <p className="text-sm text-slate-500">
                  AI-powered issue discovery for beginner-friendly open source work
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 sm:self-auto">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Backend status: {status}
            </div>
          </header>

          <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50/90 px-6 py-8 lg:border-b-0 lg:border-r">
              <div className="space-y-8 lg:sticky lg:top-8">
                <SkillsInput
                  skills={skills}
                  inputValue={skillInput}
                  onInputChange={setSkillInput}
                  onAddSkill={() => addSkills(skillInput)}
                  onRemoveSkill={(skillToRemove) =>
                    setSkills((currentSkills) =>
                      currentSkills.filter((skill) => skill !== skillToRemove)
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                      event.preventDefault()
                      addSkills(skillInput)
                    }
                  }}
                />

                <ConfidenceSlider
                  value={minConfidence}
                  onChange={setMinConfidence}
                />

                <section className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Complexity
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Targeting beginner-friendly entry points from the current
                      recommendation pipeline.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm font-semibold text-sky-700">
                    Good First Issues Only
                  </div>
                </section>

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-400 px-5 text-lg font-semibold text-white shadow-lg shadow-sky-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  {loading ? 'Finding Recommendations...' : 'Find Recommendations'}
                </button>

                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Powered by Insights
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Groq</p>
                      <p className="text-sm text-slate-500">
                        Llama 3.1 issue explanations
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Active
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="px-6 py-8">
              <div className="space-y-6">
                <ResultsHeader
                  total={sortedRecommendations.length}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  hasSearched={hasSearched}
                  loading={loading}
                />

                {loading ? (
                  <div className="grid gap-5 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-72 animate-pulse rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                      />
                    ))}
                  </div>
                ) : null}

                {!loading && sortedRecommendations.length > 0 ? (
                  <>
                    <div className="grid gap-5 xl:grid-cols-2">
                      {paginatedRecommendations.map((issue) => (
                        <RecommendationCard
                          key={issue.url}
                          issue={issue}
                          onOpen={setSelectedIssue}
                        />
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        if (page < 1 || page > totalPages) {
                          return
                        }

                        setCurrentPage(page)
                      }}
                    />
                  </>
                ) : null}

                {!loading && hasSearched && sortedRecommendations.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-8 py-16 text-center">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      No strong matches yet
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-500">
                      Try lowering the confidence threshold or adding a few more
                      skills so the backend has a wider pool to work with.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </main>

      <RecommendationDrawer
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </>
  )
}

export default AdminDashboard
