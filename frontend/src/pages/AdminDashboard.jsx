import { useEffect, useState } from 'react'
import { checkBackendHealth } from '../api/issues'

function AdminDashboard() {
  const [status, setStatus] = useState('checking')

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
          Frontend Ready
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          The backend connection now lives in
          <code className="mx-2 rounded bg-white/10 px-2 py-1 text-sm">
            src/api/axios.js
          </code>
          and this page is loaded from
          <code className="ml-2 rounded bg-white/10 px-2 py-1 text-sm">
            src/pages/AdminDashboard.jsx
          </code>
          .
        </p>
        <div className="mt-8 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          Backend status: {status}
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
