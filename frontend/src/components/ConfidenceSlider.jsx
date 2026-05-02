function ConfidenceSlider({ value, onChange }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Min. Confidence Score
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Only show issues above this ML confidence threshold.
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
          {value}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500"
      />
    </section>
  )
}

export default ConfidenceSlider
