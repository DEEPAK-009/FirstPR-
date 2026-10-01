import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login, loginWithGitHub } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const destination = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      await login(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      if (!err.response) {
        setError(`Cannot reach backend server (${err.message}). Is the backend running on port 5070?`)
      } else {
        setError(err.response?.data?.error || 'Invalid email or password')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#f0f4fa_100%)] px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-pink-500 shadow-md shadow-sky-200">
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
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back to FirstPR
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your saved issues and track contributions
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl shadow-slate-200/40">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* GitHub 1-Click Login */}
          <button
            type="button"
            onClick={loginWithGitHub}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.83c.85 0 1.7.12 2.5.35 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.58 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              Or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-pink-500 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-200 transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer inside card */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-sky-600 hover:text-sky-700">
              Sign up for free
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
