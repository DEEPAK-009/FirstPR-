import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { recommendIssues } from '../api/issues'
import { getBookmarks } from '../api/bookmarks'
import ConfidenceSlider from '../components/ConfidenceSlider'
import PaginationControls from '../components/PaginationControls'
import RecommendationCard from '../components/RecommendationCard'
import RecommendationDrawer from '../components/RecommendationDrawer'
import ResultsHeader from '../components/ResultsHeader'
import SkillsInput from '../components/SkillsInput'
import LogoutModal from '../components/LogoutModal'

const ITEMS_PER_PAGE = 10

const getStorageKey = (userId) => `firstpr_dashboard_search_${userId || 'guest'}`

const loadSavedSearchState = (userId) => {
  try {
    const raw = sessionStorage.getItem(getStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const storageKey = getStorageKey(user?.id)
  const savedState = loadSavedSearchState(user?.id)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [skills, setSkills] = useState(() => (
    savedState?.skills ||
    (user?.preferred_skills && user.preferred_skills.length > 0
      ? user.preferred_skills
      : ['TypeScript', 'React'])
  ))
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (!savedState?.skills && user?.preferred_skills && Array.isArray(user.preferred_skills) && user.preferred_skills.length > 0) {
      setSkills(user.preferred_skills)
    }
  }, [user?.preferred_skills])

  const [minConfidence, setMinConfidence] = useState(() => savedState?.minConfidence ?? 40)
  const [recommendations, setRecommendations] = useState(() => savedState?.recommendations || [])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [sortBy, setSortBy] = useState(() => savedState?.sortBy || 'highest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(() => savedState?.hasSearched ?? (savedState?.recommendations?.length > 0))
  const [currentPage, setCurrentPage] = useState(() => savedState?.currentPage ?? 1)
  const [savedUrls, setSavedUrls] = useState(() => new Set())

  // Reset search results if user logs out or session is unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setRecommendations([])
      setHasSearched(false)
      setSelectedIssue(null)
      try {
        sessionStorage.clear()
      } catch (e) {}
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (user?.id) {
      getBookmarks()
        .then((data) => {
          const urls = new Set((data.bookmarks || []).map((b) => b.url).filter(Boolean))
          setSavedUrls(urls)
        })
        .catch((err) => {
          console.warn('Could not fetch bookmarks for dashboard sync:', err)
        })
    }
  }, [user?.id])

  useEffect(() => {
    if (hasSearched && recommendations.length > 0) {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            skills,
            minConfidence,
            recommendations,
            hasSearched,
            currentPage,
            sortBy
          })
        )
      } catch (err) {
        console.warn('Failed to save search state to sessionStorage:', err)
      }
    }
  }, [storageKey, skills, minConfidence, recommendations, hasSearched, currentPage, sortBy])

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
            <Link to="/" className="flex items-center gap-4 transition hover:opacity-90">
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
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Home
              </Link>

              <div className="h-4 w-px bg-slate-200" />

              {isAuthenticated ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    to="/account"
                    className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white py-1 pl-1.5 pr-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                    title="Account & Saved Issues"
                  >
                    {user?.avatar_url && !user.avatar_url.includes('bottts') ? (
                      <img
                        src={user.avatar_url}
                        alt={user?.name || 'User'}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-xs">
                        {(user?.name || user?.github_username || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[140px] truncate">{user?.name || user?.github_username || 'Account'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 text-xs font-semibold text-rose-700 shadow-xs transition hover:border-rose-300 hover:bg-rose-100 cursor-pointer"
                    title="Sign Out"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Sign In
                </Link>
              )}
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

                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Complexity
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
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
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-400 px-5 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4.5 w-4.5"
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
                        on-demand AI plans
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
                          isSaved={savedUrls.has(issue.url)}
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
        isSaved={Boolean(selectedIssue && savedUrls.has(selectedIssue.url))}
        onSaveSuccess={(savedUrl) => {
          setSavedUrls((prev) => new Set([...prev, savedUrl]))
        }}
        onClose={() => setSelectedIssue(null)}
        onExplanationGenerated={(issueUrl, explanation) => {
          setRecommendations((prev) =>
            prev.map((item) =>
              item.url === issueUrl ? { ...item, explanation } : item
            )
          )
          setSelectedIssue((prev) =>
            prev && prev.url === issueUrl ? { ...prev, explanation } : prev
          )
        }}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false)
          setRecommendations([])
          setHasSearched(false)
          setSelectedIssue(null)
          try {
            sessionStorage.clear()
          } catch (e) {}
          logout()
          navigate('/')
        }}
      />
    </>
  )
}

export default AdminDashboard
