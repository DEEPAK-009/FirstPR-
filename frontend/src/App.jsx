function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
          Frontend Ready
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Vite + React + Tailwind CSS
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          The frontend has been scaffolded and Tailwind is active. You can now
          start building components in <code className="rounded bg-white/10 px-2 py-1 text-sm">src/App.jsx</code>.
        </p>
      </section>
    </main>
  )
}

export default App
