function SkillsInput({
  skills,
  inputValue,
  onInputChange,
  onAddSkill,
  onRemoveSkill,
  onKeyDown,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Your Skills</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add the technologies you want the recommendations to focus on.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. React, Python, AWS"
            className="h-12 flex-1 rounded-xl border-0 bg-transparent px-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onAddSkill}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Add skill"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700"
          >
            {skill}
            <button
              type="button"
              onClick={() => onRemoveSkill(skill)}
              className="rounded-full text-sky-500 transition hover:text-sky-700"
              aria-label={`Remove ${skill}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    </section>
  )
}

export default SkillsInput
