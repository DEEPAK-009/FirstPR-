import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBookmarks, updateBookmarkStatus, removeBookmark } from '../api/bookmarks'
import LogoutModal from '../components/LogoutModal'
import RecommendationDrawer from '../components/RecommendationDrawer'

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'TailwindCSS',
  'Next.js',
  'PostgreSQL',
  'Docker',
  'GraphQL'
]

const TABS = [
  {
    id: 'profile',
    label: 'Profile & Identity',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    description: 'Personal details, avatar, and linked accounts'
  },
  {
    id: 'roadmap',
    label: 'Saved Issues',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
    description: 'Manage issues saved for later, update progress, and track contributions'
  },
  {
    id: 'skills',
    label: 'Skills & Preferences',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    description: 'Your preferred tech stack and default search filters'
  },
  {
    id: 'security',
    label: 'Security & Auth',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    description: 'Password management and authentication providers'
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    description: 'Delete your account and clear saved data'
  }
]

const STATUS_CONFIG = {
  SAVED: {
    label: 'Saved',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-800'
  },
  PR_SUBMITTED: {
    label: 'PR Submitted',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-800'
  },
  MERGED: {
    label: 'Merged',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
}

function AccountPage() {
  const { user, logout, updateProfile, changePassword, deleteAccount, refreshUser } = useAuth()
  const navigate = useNavigate()

  // Active Sidebar Tab State (defaults to 'roadmap' or 'profile')
  const [activeTab, setActiveTab] = useState('roadmap')

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([])
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedIssue, setSelectedIssue] = useState(null)

  // Modals & Confirmation
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Profile Form State
  const [name, setName] = useState(user?.name || '')
  const [skills, setSkills] = useState(user?.preferred_skills || ['TypeScript', 'React'])
  const [skillInput, setSkillInput] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const loadBookmarks = async () => {
    try {
      setBookmarksLoading(true)
      const data = await getBookmarks()
      setBookmarks(data.bookmarks || [])
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
    } finally {
      setBookmarksLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
    loadBookmarks()
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || user.github_username || '')
      if (Array.isArray(user.preferred_skills) && user.preferred_skills.length > 0) {
        setSkills(user.preferred_skills)
      }
    }
  }, [user])

  // Bookmark Actions
  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await updateBookmarkStatus(issueId, newStatus)
      setBookmarks((prev) =>
        prev.map((b) => (b.id === issueId ? { ...b, status: newStatus } : b))
      )
      refreshUser()
    } catch (err) {
      console.error('Failed to update bookmark status:', err)
    }
  }

  const handleRemoveBookmark = async (issueId) => {
    try {
      await removeBookmark(issueId)
      setBookmarks((prev) => prev.filter((b) => b.id !== issueId))
      refreshUser()
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
    }
  }

  // Skills handlers
  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim()
    if (!trimmed) return
    if (!skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed])
    }
    setSkillInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddSkill(skillInput)
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove))
  }

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMessage({ type: '', text: '' })
    try {
      setProfileSaving(true)
      await updateProfile({
        name,
        preferred_skills: skills
      })
      setProfileMessage({ type: 'success', text: 'Profile changes saved successfully!' })
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000)
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save profile changes'
      })
    } finally {
      setProfileSaving(false)
    }
  }

  // Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    try {
      setPasswordSaving(true)
      await changePassword(currentPassword, newPassword)
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000)
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update password'
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      setDeleting(true)
      await deleteAccount()
      navigate('/')
    } catch (err) {
      console.error('Failed to delete account:', err)
      alert(err.response?.data?.error || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : 'Recent'

  // Computed counts from bookmarks
  const savedCount = bookmarks.filter((b) => (b.status || 'SAVED') === 'SAVED').length
  const inProgressCount = bookmarks.filter((b) => b.status === 'IN_PROGRESS').length
  const prSubmittedCount = bookmarks.filter((b) => b.status === 'PR_SUBMITTED').length
  const mergedCount = bookmarks.filter((b) => b.status === 'MERGED').length

  const filteredBookmarks = bookmarks.filter((b) => {
    if (statusFilter === 'ALL') return true
    return (b.status || 'SAVED') === statusFilter
  })

  const currentTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_36%),linear-gradient(180deg,_#f8fbff_0%,_#f2f6fc_100%)] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        {/* ── Top Header ── */}
        <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-90">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-500 shadow-md shadow-sky-200">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
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
                <span className="text-xl font-bold tracking-tight text-slate-900">FirstPR</span>
                <span className="ml-2 text-xs font-semibold text-slate-400">/ Account Center</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Issue Workspace
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
        </header>

        {/* ── Dashboard Layout: Left Sidebar + Right Workspace ── */}
        <div className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[290px_minmax(0,1fr)]">
          {/* ── Left Sidebar Navigation ── */}
          <aside className="flex flex-col justify-between border-b border-slate-200 bg-slate-50/70 p-6 lg:border-b-0 lg:border-r">
            <div className="space-y-6">
              {/* User Mini Profile Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {(user?.avatar_url || user?.avatarUrl) && !(user?.avatar_url || user?.avatarUrl).includes('bottts') ? (
                      <img
                        src={user.avatar_url || user.avatarUrl}
                        alt={user?.name || 'User'}
                        className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-sm">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user?.github_username && (
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {user?.name || user?.github_username || 'Contributor'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                  <span className="font-semibold text-slate-400">Saved Issues</span>
                  <span className="inline-flex items-center gap-1 font-bold text-sky-600">
                    {bookmarks.length} {bookmarks.length === 1 ? 'issue' : 'issues'}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div>
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account Dashboard
                </p>
                <nav className="mt-2 space-y-1">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const isDanger = tab.id === 'danger'
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? isDanger
                              ? 'bg-rose-50 text-rose-700 font-bold shadow-sm'
                              : 'bg-white text-sky-700 shadow-sm border border-slate-200/80 font-bold'
                            : isDanger
                            ? 'text-rose-600 hover:bg-rose-50/60'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? (isDanger ? 'text-rose-600' : 'text-sky-600') : 'text-slate-400'}>
                            {tab.icon}
                          </span>
                          <span>{tab.label}</span>
                        </div>
                        {tab.id === 'roadmap' && bookmarks.length > 0 && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                            {bookmarks.length}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Sidebar Bottom Card */}
            <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
              <div className="flex items-center gap-2 text-sky-800">
                <span className="text-base">💡</span>
                <span className="text-xs font-bold">FirstPR Tip</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-sky-700">
                Saved issues stay synchronized with your Neon database across all devices and sessions.
              </p>
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <main className="p-6 sm:p-10">
            {/* Header of Active Section */}
            <div className="border-b border-slate-200 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {currentTabInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {currentTabInfo.label}
                    </h2>
                    <p className="text-xs text-slate-500">{currentTabInfo.description}</p>
                  </div>
                </div>

                {activeTab === 'roadmap' && (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-sky-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      + Find more issues →
                    </Link>
                    <button
                      type="button"
                      onClick={loadBookmarks}
                      disabled={bookmarksLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${bookmarksLoading ? 'animate-spin text-sky-600' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENT: SAVED ISSUES */}
            {activeTab === 'roadmap' && (
              <div className="mt-8 space-y-4">
                {/* Bookmarks List */}
                {bookmarksLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                    ))}
                  </div>
                ) : filteredBookmarks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookmarks.map((bookmark) => {
                      const status = bookmark.status || 'SAVED'
                      const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAVED

                      return (
                        <div
                          key={bookmark.id || bookmark.bookmark_id}
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              {/* Repo & Confidence */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  {bookmark.repo || 'unknown repo'}
                                </span>
                                {bookmark.confidence !== undefined && bookmark.confidence !== null ? (
                                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200/60">
                                    {bookmark.confidence > 1
                                      ? Math.round(bookmark.confidence)
                                      : Math.round(bookmark.confidence * 100)}% Match
                                  </span>
                                ) : null}
                              </div>

                              {/* Title */}
                              <h4 className="mt-2 text-base font-bold text-slate-900">
                                <a
                                  href={bookmark.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-sky-600 transition"
                                >
                                  {bookmark.title}
                                </a>
                              </h4>

                              {/* Labels */}
                              {Array.isArray(bookmark.labels) && bookmark.labels.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {bookmark.labels.slice(0, 4).map((label, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* AI Explanation / Approach Preview */}
                              {(bookmark.explanation || bookmark.matchReason) && (
                                <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                                  {bookmark.matchReason || bookmark.explanation}
                                </p>
                              )}
                            </div>

                            {/* Right Actions: Status Dropdown & Buttons */}
                            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                              {/* Status Selector */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-400 sm:hidden">Status:</span>
                                <select
                                  value={status}
                                  onChange={(e) => handleUpdateStatus(bookmark.id, e.target.value)}
                                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer outline-none ${config.badgeClass}`}
                                >
                                  <option value="SAVED">Saved</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="PR_SUBMITTED">PR Submitted</option>
                                  <option value="MERGED">Merged</option>
                                </select>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedIssue(bookmark)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                  title="View AI Breakdown"
                                >
                                  Insights
                                </button>

                                <a
                                  href={bookmark.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                >
                                  GitHub
                                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                  </svg>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveBookmark(bookmark.id)}
                                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                  title="Remove from Saved"
                                >
                                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center">
                    <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      No saved issues yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                      Explore beginner-friendly open-source issues on the workspace and click{' '}
                      <strong>Save for Later</strong> in the issue drawer to track your saved issues.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-200 hover:bg-slate-800 transition"
                      >
                        Discover Issues on Workspace →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
              <div className="mt-8 max-w-2xl space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Profile Details</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Your public identity and contact email</p>

                  <div className="mt-6 flex items-center gap-5">
                    {(user?.avatar_url || user?.avatarUrl) && !(user?.avatar_url || user?.avatarUrl).includes('bottts') ? (
                      <img
                        src={user.avatar_url || user.avatarUrl}
                        alt={user?.name || 'User avatar'}
                        className="h-20 w-20 rounded-2xl border-2 border-slate-200 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-extrabold text-white shadow-sm">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-900">
                        {user?.name || user?.github_username || 'FirstPR Contributor'}
                      </p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="text-[11px] font-medium text-slate-400">
                        Joined FirstPR on {memberSince}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                    {profileMessage.text && (
                      <div
                        className={`rounded-xl border p-3 text-xs font-semibold ${
                          profileMessage.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                      >
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Linked Accounts Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Connected Accounts</h3>
                  <p className="mt-0.5 text-xs text-slate-500">GitHub integration status</p>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">GitHub</p>
                        {user?.github_username ? (
                          <p className="text-[11px] text-slate-500">
                            Connected as <span className="font-semibold text-slate-700">@{user.github_username}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400">Not connected via GitHub</p>
                        )}
                      </div>
                    </div>

                    {user?.github_username ? (
                      <a
                        href={`https://github.com/${user.github_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View Profile
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    ) : (
                      <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Email Login
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKILLS & PREFERENCES */}
            {activeTab === 'skills' && (
              <div className="mt-8 max-w-2xl space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Preferred Technologies</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Add tags to customize the initial search keywords loaded when you open the Workspace.
                  </p>

                  {profileMessage.text && (
                    <div
                      className={`mt-4 rounded-xl border p-3 text-xs font-semibold ${
                        profileMessage.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {profileMessage.text}
                    </div>
                  )}

                  {/* Active Skills Chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="rounded-full p-0.5 text-sky-600 hover:bg-sky-200/60 hover:text-sky-900 cursor-pointer"
                          title="Remove skill"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Skill Input */}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a skill and press Enter (e.g. Go, Rust, Docker)..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill(skillInput)}
                      className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Suggestions */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
                    {POPULAR_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 8)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddSkill(suggestion)}
                          className="rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600 cursor-pointer"
                        >
                          + {suggestion}
                        </button>
                      ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {profileSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SECURITY & AUTH */}
            {activeTab === 'security' && (
              <div className="mt-8 max-w-2xl space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900">Authentication Credentials</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Update your security settings and credentials</p>

                  {user?.github_username && !user?.has_password ? (
                    <div className="mt-5 flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                      <div className="rounded-xl bg-slate-900 p-2.5 text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Delegated to GitHub OAuth</h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Your account signs in securely using your GitHub identity (@{user.github_username}).
                          Passkeys and two-factor authentication are safely managed on your GitHub account.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                      {passwordMessage.text && (
                        <div
                          className={`rounded-xl border p-3 text-xs font-semibold ${
                            passwordMessage.type === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {passwordMessage.text}
                        </div>
                      )}

                      {user?.has_password && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          {passwordSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="mt-8 max-w-2xl space-y-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-rose-900">Delete Account Permanently</h3>
                  <p className="mt-1 text-xs leading-relaxed text-rose-700">
                    Once you delete your account, your profile, search preferences, and saved bookmarks will be erased permanently from Neon PostgreSQL. There is no recovery.
                  </p>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Recommendation Drawer for inspecting saved issue */}
      <RecommendationDrawer
        issue={selectedIssue}
        isSaved={true}
        onClose={() => setSelectedIssue(null)}
        onExplanationGenerated={(issueUrl, explanation) => {
          setBookmarks((prev) =>
            prev.map((item) =>
              item.url === issueUrl ? { ...item, explanation } : item
            )
          )
          setSelectedIssue((prev) =>
            prev && prev.url === issueUrl ? { ...prev, explanation } : prev
          )
        }}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false)
          logout()
          navigate('/')
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Account</h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              This will permanently delete your user profile and all bookmarks associated with{' '}
              <strong className="text-slate-800">{user?.email}</strong>.
            </p>

            <p className="mt-4 text-xs font-semibold text-slate-700">
              Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountPage
