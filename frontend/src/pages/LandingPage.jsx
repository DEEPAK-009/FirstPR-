import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LogoutModal from '../components/LogoutModal'

function LandingPage() {
  const { user, isAuthenticated, loginWithGitHub, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#f0f4fa_100%)] text-slate-900">
      {/* ── Top Navbar ── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-500 shadow-md shadow-sky-200">
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
            <span className="text-xl font-bold tracking-tight text-slate-900">FirstPR</span>
            <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              v1.0
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <a
            href="#how-it-works"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block"
          >
            Features
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/account"
                className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white py-1 pl-1.5 pr-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                title="Account Settings"
              >
                {(user?.avatar_url || user?.avatarUrl) && !(user?.avatar_url || user?.avatarUrl).includes('bottts') ? (
                  <img
                    src={user.avatar_url || user.avatarUrl}
                    alt={user.name || 'User'}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-xs">
                    {(user?.name || user?.github_username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[140px] truncate">{user?.name || user?.github_username || 'Account'}</span>
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                Dashboard
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
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md sm:text-sm"
              >
                Sign In
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative mx-auto max-w-5xl px-6 pt-16 pb-24 text-center sm:px-8 sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-800 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Powered by Machine Learning & LLaMA 3.1 AI
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15]">
          Find your first open-source issue in{' '}
          <span className="bg-gradient-to-r from-sky-500 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
            minutes, not days.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
          Most GitHub issues are vague, overwhelming, or already taken. FirstPR filters thousands of issues using ML to score beginner-friendliness and generates plain-English step-by-step approach guides.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-pink-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-sky-200 transition hover:opacity-95 sm:w-auto"
            >
              Open My Workspace
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-pink-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-sky-200 transition hover:opacity-95 sm:w-auto"
              >
                Find My First Issue
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={loginWithGitHub}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                </svg>
                Sign in with GitHub
              </button>
            </>
          )}
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 sm:gap-12">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">5,000+</span>
            <span>Issues Analyzed</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">&lt; 10</span>
            <span>Comments Filter</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-600">80ms</span>
            <span>AI Insights Latency</span>
          </div>
        </div>
      </section>

      {/* ── Visual Preview Card ── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-medium text-slate-400">FirstPR Recommendation Preview</span>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
              88% Beginner Friendly
            </span>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">facebook/react</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Add missing propType validation for Header</h3>
              <div className="mt-3 flex gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">good-first-issue</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">documentation</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                The Header component is missing PropTypes for title and user object. Add validation and write a unit test.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-600">AI Step-by-Step Roadmap</p>
              <ol className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                <li><strong className="text-slate-900">1. Locate:</strong> Find <code className="rounded bg-sky-100 px-1 py-0.5">src/components/Header.jsx</code>.</li>
                <li><strong className="text-slate-900">2. Implement:</strong> Import <code className="rounded bg-sky-100 px-1 py-0.5">prop-types</code> and define <code className="rounded bg-sky-100 px-1 py-0.5">Header.propTypes</code>.</li>
                <li><strong className="text-slate-900">3. Test:</strong> Run <code className="rounded bg-sky-100 px-1 py-0.5">npm test Header.test.js</code> and verify pass.</li>
                <li><strong className="text-slate-900">4. PR:</strong> Fork, push branch, and submit your PR!</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="border-t border-slate-200/80 bg-white/70 py-24 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">How It Works</h2>
            <p className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              From zero to your first merged PR
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 font-bold text-white shadow-md shadow-sky-200">
                1
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Enter Your Skills</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Type in skills like React, TypeScript, Python, or Go. FirstPR builds an optimized GitHub search targeting issues with low comment competition.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-200">
                2
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">ML Classifies Difficulty</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Our scikit-learn model evaluates issue titles, descriptions, and labels to score whether the ticket is truly approachable for a beginner.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500 font-bold text-white shadow-md shadow-pink-200">
                3
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">AI Generates Your Roadmap</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Groq AI explains what the ticket actually means, why it matters, and gives you a concrete 4-step checklist to solve it and create your pull request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Core Features</h2>
            <p className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Engineered for developer productivity
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                🎯
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Low-Competition Filtering</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Automatically discards issues with &gt;10 comments to ensure tickets aren't already locked by senior contributors.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                🎚️
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Interactive Confidence Slider</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Fine-tune recommendation strictness from 0% to 100% confidence to match your exact comfort level.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                ⚡
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Microsecond AI Inference</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Powered by Groq's high-throughput LPU cloud, delivering instant roadmaps without sluggish waiting times.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                💾
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Neon Cloud Storage</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Bookmark issues to a serverless PostgreSQL database and maintain your contribution history across sessions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                🔍
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Contextual Drawer View</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Inspect original issue markdown, comments count, match rationale, and direct GitHub links in a side drawer.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                🛡️
              </div>
              <h4 className="mt-4 font-bold text-slate-900">Zero-Crash Fallback</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Relaxed dual-pass filters prevent empty screen states even when strict search criteria find few candidates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-center sm:px-8">
        <p className="text-sm font-semibold text-slate-700">FirstPR — AI-Powered Open Source Issue Discovery</p>
        <p className="mt-2 text-xs text-slate-400">
          Built with React, Express, Python FastAPI, Scikit-learn, and Neon PostgreSQL.
        </p>
      </footer>

      {/* ── Logout Confirmation Modal ── */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false)
          logout()
          navigate('/')
        }}
      />
    </div>
  )
}

export default LandingPage
